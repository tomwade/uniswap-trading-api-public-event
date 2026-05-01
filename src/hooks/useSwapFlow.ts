import { useCallback, useState } from 'react';
import type { Hex } from 'viem';
import {
  getPublicClient,
  getWalletClient,
  switchChain,
} from '@wagmi/core';
import confetti from 'canvas-confetti';
import { wagmiConfig } from '@/config/wagmi';
import { UNICHAIN_SEPOLIA_ID } from '@/config/chain';
import {
  checkApproval,
  getSwap,
  validateSwapTx,
  type ClassicQuoteResponse,
  type Slippage,
} from '@/lib/tradingApi';
import type { Token } from '@/config/tokens';
import { safeParseUnits, formatTokenAmount } from '@/lib/formatters';
import { useTxHistory } from './useTxHistory';

export type StepState = 'idle' | 'pending' | 'success' | 'error';

export interface FlowStep {
  id: 'approve' | 'permit' | 'swap';
  label: string;
  description: string;
  state: StepState;
  errorMessage?: string;
}

interface RunArgs {
  account: `0x${string}`;
  tokenIn: Token;
  tokenOut: Token;
  amountInDisplay: string;
  slippage: Slippage;
  quoteResponse: ClassicQuoteResponse;
  onTxSubmitted?: (hash: Hex) => void;
}

export function useSwapFlow() {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submittedHash, setSubmittedHash] = useState<Hex | null>(null);
  const [done, setDone] = useState(false);

  const { add: addTx, update: updateTx } = useTxHistory();

  const reset = useCallback(() => {
    setOpen(false);
    setSteps([]);
    setError(null);
    setSubmittedHash(null);
    setDone(false);
  }, []);

  const setStep = useCallback(
    (id: FlowStep['id'], patch: Partial<FlowStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const run = useCallback(
    async ({
      account,
      tokenIn,
      tokenOut,
      amountInDisplay,
      quoteResponse,
      onTxSubmitted,
    }: RunArgs) => {
      setOpen(true);
      setError(null);
      setSubmittedHash(null);
      setDone(false);

      const rawAmount = safeParseUnits(amountInDisplay, tokenIn.decimals);
      if (!rawAmount) {
        setError('Invalid amount');
        return;
      }

      // Plan steps in advance so the modal renders the right indicators.
      const initialSteps: FlowStep[] = [];
      const needsApprovalCheck = !tokenIn.isNative;
      let approvalNeeded = false;
      const permitNeeded =
        Boolean(quoteResponse.permitData) &&
        typeof quoteResponse.permitData === 'object';

      if (needsApprovalCheck) {
        initialSteps.push({
          id: 'approve',
          label: `Approve ${tokenIn.symbol}`,
          description: 'One-time on-chain approval to Permit2',
          state: 'idle',
        });
      }
      if (permitNeeded) {
        initialSteps.push({
          id: 'permit',
          label: 'Sign permit',
          description: 'Off-chain signature — no gas',
          state: 'idle',
        });
      }
      initialSteps.push({
        id: 'swap',
        label: 'Confirm swap',
        description: 'Send the swap transaction',
        state: 'idle',
      });
      setSteps(initialSteps);

      try {
        await switchChain(wagmiConfig, { chainId: UNICHAIN_SEPOLIA_ID });
        const walletClient = await getWalletClient(wagmiConfig, {
          chainId: UNICHAIN_SEPOLIA_ID,
        });
        const publicClient = getPublicClient(wagmiConfig, {
          chainId: UNICHAIN_SEPOLIA_ID,
        });
        if (!publicClient) throw new Error('Public client unavailable');

        // Step 1: Approval (if ERC20)
        if (needsApprovalCheck) {
          setStep('approve', { state: 'pending' });
          const approvalRes = await checkApproval({
            walletAddress: account,
            token: tokenIn.address,
            amount: rawAmount.toString(),
            chainId: UNICHAIN_SEPOLIA_ID,
          });

          if (approvalRes.approval) {
            approvalNeeded = true;
            const hash = await walletClient.sendTransaction({
              to: approvalRes.approval.to,
              data: approvalRes.approval.data,
              value: BigInt(approvalRes.approval.value || '0'),
            });
            await publicClient.waitForTransactionReceipt({ hash });
            setStep('approve', { state: 'success' });
          } else {
            // Already approved — collapse to success without submitting
            setStep('approve', {
              state: 'success',
              description: 'Already approved',
            });
          }
        }

        // Step 2: Permit signature (if returned by /quote)
        let permitSignature: Hex | undefined;
        if (permitNeeded) {
          setStep('permit', { state: 'pending' });
          const pd = quoteResponse.permitData as {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
            values: Record<string, unknown>;
            primaryType?: string;
          };
          const primaryType =
            pd.primaryType ??
            (Object.keys(pd.types).find((k) => k !== 'EIP712Domain') ||
              'PermitSingle');
          // Wallet signTypedData has tightly-coupled generic types we can't
          // satisfy with API JSON; cast through unknown to a permissive shape.
          const signTypedData = walletClient.signTypedData as (args: {
            domain: unknown;
            types: unknown;
            primaryType: string;
            message: unknown;
          }) => Promise<Hex>;
          permitSignature = await signTypedData({
            domain: pd.domain,
            types: pd.types,
            primaryType,
            message: pd.values,
          });
          setStep('permit', { state: 'success' });
        }

        // Step 3: Swap
        setStep('swap', { state: 'pending' });
        const swapResp = await getSwap(quoteResponse, permitSignature);
        validateSwapTx(swapResp.swap);

        const hash = await walletClient.sendTransaction({
          to: swapResp.swap.to,
          data: swapResp.swap.data,
          value: BigInt(swapResp.swap.value || '0'),
        });
        setSubmittedHash(hash);
        onTxSubmitted?.(hash);

        // Read amounts to record in history (display form)
        const amountInRecord = amountInDisplay;
        const amountOutRecord = formatTokenAmount(
          quoteResponse.quote.output.amount,
          tokenOut.decimals,
          6,
        );

        addTx({
          hash,
          chainId: UNICHAIN_SEPOLIA_ID,
          tokenInSymbol: tokenIn.symbol,
          tokenOutSymbol: tokenOut.symbol,
          amountIn: amountInRecord,
          amountOut: amountOutRecord,
          walletAddress: account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const ok = receipt.status === 'success';
        setStep('swap', {
          state: ok ? 'success' : 'error',
          errorMessage: ok ? undefined : 'Transaction reverted',
        });
        updateTx(hash, { status: ok ? 'success' : 'failed' });

        if (ok) {
          setDone(true);
          // Playful confetti burst
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.3 },
            colors: ['#ff007a', '#7d52ff', '#5e2bff', '#fff3a8'],
          });
        } else {
          setError('Transaction reverted on-chain');
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unknown error during swap';
        setError(msg);
        // Mark current pending step as error
        setSteps((prev) =>
          prev.map((s) =>
            s.state === 'pending' ? { ...s, state: 'error', errorMessage: msg } : s,
          ),
        );
      }

      return { approvalNeeded, permitNeeded };
    },
    [addTx, setStep, updateTx],
  );

  return {
    open,
    steps,
    error,
    submittedHash,
    done,
    setOpen,
    run,
    reset,
  };
}
