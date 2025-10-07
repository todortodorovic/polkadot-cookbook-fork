import { ApiPromise, WsProvider } from '@polkadot/api';

async function main() {
  // Create a WebSocket provider
  const provider = new WsProvider('wss://rpc.polkadot.io');

  // Create the API instance
  const api = await ApiPromise.create({ provider });

  // Get chain information
  const chain = await api.rpc.system.chain();
  const lastHeader = await api.rpc.chain.getHeader();

  console.log(`Connected to chain: ${chain}`);
  console.log(`Latest block number: ${lastHeader.number}`);

  // Disconnect
  await api.disconnect();
}

main().catch(console.error);
