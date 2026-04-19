import { createAccount } from "@turnkey/viem";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { base } from "viem/chains";
import { turnkeyClient, TURNKEY_ORGANIZATION_ID } from "./turnkey.service";

// Minimal ERC-20 ABI for Transfer
const erc20Abi = [{ type: "function", name: "transfer", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" }] as const;

export async function executeGaslessWithdrawal(
  turnkeySignerAddress: string,
  foxbitOfframpAddress: string,
  usdcContractAddress: string,
  amount: number
): Promise<string> {
  const PIMLICO_URL = process.env.PIMLICO_URL || "https://api.pimlico.io/v2/8453/rpc?apikey=YOUR_API_KEY";

  const publicClient = createPublicClient({ chain: base, transport: http() });
  
  // 1. Re-instantiate Turnkey Signer
  const turnkeyAccount = await createAccount({
    client: turnkeyClient,
    organizationId: TURNKEY_ORGANIZATION_ID,
    signWith: turnkeySignerAddress,
  });

  // 2. Re-instantiate Smart Account
  const smartAccount = await toSimpleSmartAccount({
    client: publicClient,
    owner: turnkeyAccount,
    factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
  });

  // 3. Setup Pimlico Client
  const pimlicoClient = createPimlicoClient({
    transport: http(PIMLICO_URL),
    entryPoint: {
      address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      version: "0.6"
    }
  });

  // 4. Create Smart Account Client
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain: base,
    bundlerTransport: http(PIMLICO_URL),
    paymaster: pimlicoClient, // Paymaster integration!
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      }
    }
  });

  // 5. Construct CallData (ERC-20 Transfer)
  const callData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [foxbitOfframpAddress as `0x${string}`, parseUnits(amount.toString(), 6)],
  });

  // 6. Send UserOperation (This sponsors, signs via Turnkey, and submits to Bundler)
  try {
    const userOpHash = await smartAccountClient.sendUserOperation({
      calls: [{
        to: usdcContractAddress as `0x${string}`,
        value: 0n,
        data: callData,
      }],
    });

    // Wait for receipt
    const receipt = await pimlicoClient.waitForUserOperationReceipt({ hash: userOpHash });
    return receipt.receipt.transactionHash;
    
  } catch (error) {
    console.error("Bundler/Turnkey rejected the transaction:", error);
    throw new Error("Failed to execute gasless withdrawal.");
  }
}
