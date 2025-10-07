# Connect to Polkadot and Read Chain Info

Learn how to connect to a Polkadot node and read basic blockchain information using the Polkadot.js API.

## Prerequisites

- Node.js `20+` (check with `node --version`)
- Basic knowledge of TypeScript
- Understanding of blockchain fundamentals

## What You'll Learn

In this tutorial, you will:

- Connect to a Polkadot node using `@polkadot/api`
- Read the chain name and latest block number
- Properly handle async connections and cleanup

## Setup

1. **Install dependencies**

   ```bash
   cd tutorials/my-tutorial
   npm install
   ```

2. **Explore the code**

   Check out the example in `my-tutorial-code/src/index.ts` to see how to:
   - Create an API instance
   - Connect to a node
   - Query chain information
   - Disconnect properly

## Running the Example

```bash
cd my-tutorial-code
npm install
npm start
```

This will connect to the public Polkadot endpoint and display:

- Chain name (e.g., "Polkadot")
- Latest block number

## Testing

Run the end-to-end tests:

```bash
cd tutorials/my-tutorial
npm run test
```

Note: Tests will skip if no local node is running.

## Key Concepts

- **ApiPromise**: Main interface for interacting with Polkadot
- **WsProvider**: WebSocket provider for node connection
- **RPC methods**: Remote procedure calls to query chain data
- **Async/await**: Handling asynchronous blockchain operations

## Next Steps

- Try connecting to different networks (Kusama, Westend)
- Explore other RPC methods in the Polkadot.js docs
- Build your own queries for account balances and transfers
