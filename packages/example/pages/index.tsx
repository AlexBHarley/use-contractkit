import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Networks, useContractKit } from '@celo-tools/use-contractkit';
import { ensureLeading0x } from '@celo/utils/lib/address';
import Web3 from 'web3';
import { SecondaryButton, PrimaryButton, toast } from '../components';
import { TYPED_DATA } from '../utils';

const defaultSummary = {
  name: '',
  address: '',
  wallet: '',
  authorizedSigners: {
    vote: '',
    attestation: '',
    validator: '',
  },
  celo: '',
  cusd: '',
};

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(36)}`;
}

export default function Home() {
  const {
    kit,
    address,
    network,
    updateNetwork,
    openModal,
    destroy,
    send,
  } = useContractKit();

  const [summary, setSummary] = useState(defaultSummary);
  const [sending, setSending] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!address) {
      setSummary(defaultSummary);
      return;
    }

    const [accounts, goldToken, stableToken] = await Promise.all([
      kit.contracts.getAccounts(),
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(),
    ]);
    const [summary, celo, cusd] = await Promise.all([
      accounts.getAccountSummary(address).catch((e) => defaultSummary),
      goldToken.balanceOf(address).then((x) => x.toString()),
      stableToken.balanceOf(address).then((x) => x.toString()),
    ]);
    setSummary({
      ...summary,
      celo,
      cusd,
    });
  }, [address]);

  const testSendTransaction = async () => {
    try {
      setSending(true);
      const celo = await kit.contracts.getGoldToken();
      if (
        await send(
          celo
            // impact market contract
            .transfer(
              '0x73D20479390E1acdB243570b5B739655989412f5',
              Web3.utils.toWei('0.00000001', 'ether')
            )
        )
      ) {
        toast.success('sendTransaction succeeded');
        fetchSummary();
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const testSignTypedData = async () => {
    if (!address) {
      openModal();
      return;
    }

    setSending(true);
    try {
      await kit.signTypedData(address, TYPED_DATA);
      toast.success('signTypedData succeeded');
    } catch (e) {
      toast.error(e.message);
    }

    setSending(false);
  };

  const testSignPersonal = async () => {
    if (!address) {
      openModal();
      return;
    }

    setSending(true);
    try {
      await kit.connection.sign(
        ensureLeading0x(Buffer.from('Hello').toString('hex')),
        address
      );
      toast.success('sign_personal succeeded');
    } catch (e) {
      toast.error(e.message);
    }

    setSending(false);
  };

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div>
      <Head>
        <title>use-contractkit</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {sending && (
        <div className="fixed right-4 top-4">
          <Loader type="TailSpin" color="#FBCC5C" height="36px" width="36px" />
        </div>
      )}

      <main className="max-w-screen-sm mx-auto py-10 md:py-20 px-4">
        <div className="font-semibold text-2xl">use-contractkit</div>
        <div className="text-gray-600 mt-2">
          A{' '}
          <a
            className="underline"
            href="https://reactjs.org/docs/hooks-intro.html"
            target="_blank"
          >
            React hook
          </a>{' '}
          to ease connecting to the{' '}
          <a
            href="https://celo.org/"
            target="_blank"
            style={{ color: 'rgba(53,208,127,1.00)' }}
          >
            Celo{' '}
            <svg
              data-name="Celo Rings"
              viewBox="0 0 950 950"
              className="inline h-4 w-4 mb-1"
            >
              <path
                data-name="Top Ring"
                d="M575 650c151.88 0 275-123.12 275-275S726.88 100 575 100 300 223.12 300 375s123.12 275 275 275zm0 100c-207.1 0-375-167.9-375-375S367.9 0 575 0s375 167.9 375 375-167.9 375-375 375z"
                fill="#35d07f"
              />
              <path
                data-name="Bottom Ring"
                d="M375 850c151.88 0 275-123.12 275-275S526.88 300 375 300 100 423.12 100 575s123.12 275 275 275zm0 100C167.9 950 0 782.1 0 575s167.9-375 375-375 375 167.9 375 375-167.9 375-375 375z"
                fill="#fbcc5c"
              />
              <path
                data-name="Rings Overlap"
                d="M587.39 750a274.38 274.38 0 0054.55-108.06A274.36 274.36 0 00750 587.4a373.63 373.63 0 01-29.16 133.45A373.62 373.62 0 01587.39 750zM308.06 308.06A274.36 274.36 0 00200 362.6a373.63 373.63 0 0129.16-133.45A373.62 373.62 0 01362.61 200a274.38 274.38 0 00-54.55 108.06z"
                fill="#ecff8f"
              />
            </svg>
          </a>{' '}
          network.
        </div>

        <div className="mt-6">
          <div className="mb-2 text-lg">Find it on:</div>
          <ul className="list-disc list-inside">
            <li>
              <a
                className="text-blue-500"
                target="_blank"
                href="https://www.npmjs.com/package/@celo-tools/use-contractkit"
              >
                NPM
              </a>
            </li>
            <li>
              <a
                className="text-blue-500"
                target="_blank"
                href="https://github.com/celo-tools/use-contractkit"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-lg">Used by:</div>
          <ul className="list-disc list-inside">
            <li>
              <a
                target="_blank"
                className="text-blue-500"
                href="https://celo-dapp.vercel.app"
              >
                Celo Tools
              </a>
            </li>
            <li>
              <a
                target="_blank"
                className="text-blue-500"
                href="https://celo-data.nambrot.com/multisig"
              >
                Web multi-sig interface
              </a>
            </li>
            <li>
              <a
                className="text-blue-500"
                target="_blank"
                href="https://github.com/AlexBHarley/use-contractkit"
              >
                Add yours to the list...
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-lg">Try it out</div>
          <div className="text-gray-600 mb-4">
            Connect to your wallet of choice and sign something for send a test
            transaction
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-8 mb-4">
              <select
                className="border border-gray-300 rounded px-4 py-2"
                value={network}
                onChange={(e) => updateNetwork(e.target.value as Networks)}
              >
                {Object.values(Networks).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {address ? (
                <SecondaryButton onClick={destroy}>Disconnect</SecondaryButton>
              ) : (
                <SecondaryButton onClick={openModal}>Connect</SecondaryButton>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
              <PrimaryButton
                disabled={sending}
                onClick={testSendTransaction}
                className="w-full md:w-max"
              >
                Test sendTransaction
              </PrimaryButton>
              <PrimaryButton
                disabled={sending}
                onClick={testSignTypedData}
                className="w-full md:w-max"
              >
                Test signTypedData
              </PrimaryButton>
              <PrimaryButton
                disabled={sending}
                onClick={testSignPersonal}
                className="w-full md:w-max"
              >
                Test signPersonal
              </PrimaryButton>
            </div>

            {address && (
              <div className="w-64 md:w-96 space-y-4 text-gray-700">
                <div className="mb-4">
                  <div className="text-lg font-bold mb-2 text-gray-900">
                    Account summary
                  </div>
                  <div className="space-y-2">
                    <div>Name: {summary.name || 'Not set'}</div>
                    <div className="">Address: {truncateAddress(address)}</div>
                    <div className="">
                      Wallet:{' '}
                      {summary.wallet
                        ? truncateAddress(summary.wallet)
                        : 'Not set'}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">Signers</div>
                      <div className="ml-4">
                        {Object.keys(summary.authorizedSigners).map(
                          (signer) => (
                            <div className="mt-1">
                              {signer}:{' '}
                              {summary.authorizedSigners[signer]
                                ? truncateAddress(
                                    summary.authorizedSigners[signer]
                                  )
                                : 'Not set'}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold mb-2 text-gray-900">
                    Balances
                  </div>
                  <div className="space-y-2">
                    <div>
                      CELO: {Web3.utils.fromWei(summary.celo.toString())}
                    </div>
                    <div>
                      cUSD: {Web3.utils.fromWei(summary.cusd.toString())}
                    </div>
                    <div>cEUR: 0.00</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
