import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { Client } from "pg";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const stamper = new ApiKeyStamper({
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || "",
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || "",
});

export const turnkeyClient = new TurnkeyClient({ baseUrl: "https://api.turnkey.com" }, stamper);
export const TURNKEY_ORGANIZATION_ID = process.env.TURNKEY_ORGANIZATION_ID || "";

// We configure Base as the default, but Polygon can also be used.
const publicClient = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL) });

export async function createSmartWalletForEntity(
  dbClient: Client,
  entityId: string,
  entityName: string
): Promise<string> {
  // 1. Create Sub-Org/Wallet in Turnkey Enclave
  const walletResponse = await turnkeyClient.createWallet({
    type: "ACTIVITY_TYPE_CREATE_WALLET",
    organizationId: TURNKEY_ORGANIZATION_ID,
    parameters: {
      walletName: `Smart Account Signer - ${entityName}`,
      accounts: [{ curve: "CURVE_SECP256K1", pathFormat: "PATH_FORMAT_BIP32", path: "m/44'/60'/0'/0/0", addressFormat: "ADDRESS_FORMAT_ETHEREUM" }],
    },
    timestampMs: String(Date.now()),
  });

  const turnkeyAddress = walletResponse.activity.result.createWalletResult?.addresses[0];
  
  if (!turnkeyAddress) throw new Error("Turnkey generation failed");

  // 2. Create Turnkey Viem Account (The Signer)
  const turnkeyAccount = await createAccount({
    client: turnkeyClient,
    organizationId: TURNKEY_ORGANIZATION_ID,
    signWith: turnkeyAddress,
  });

  // 3. Predict the Smart Account Address (e.g., SimpleAccount)
  const smartAccount = await toSimpleSmartAccount({
    client: publicClient,
    owner: turnkeyAccount,
    factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454", // SimpleAccountFactory on Base/Polygon
  });

  const smartAccountAddress = smartAccount.address;

  // 4. Save the SMART ACCOUNT address to DB (Not the Turnkey EOA)
  try {
      await dbClient.query(
        `INSERT INTO wallets (id, owner_id, address) VALUES (gen_random_uuid(), $1, $2)`,
        [entityId, smartAccountAddress] // Turnkey Address could be saved in another column, e.g. provider_wallet_id
      );
  } catch (e: any) {
      console.warn("Failed to insert into wallets:", e.message);
  }

  return smartAccountAddress;
}
