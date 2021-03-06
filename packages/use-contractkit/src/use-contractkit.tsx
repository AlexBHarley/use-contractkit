import { ContractKit, newKit } from '@celo/contractkit';
import { CeloTransactionObject } from '@celo/connect';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import { createContainer } from 'unstated-next';
import { getFornoUrl, localStorageKeys } from './constants';
import { fromPrivateKey } from './create-kit';
import { Modal } from './modal';
import { Networks, Provider } from './types';

const lastUsedNetwork =
  (typeof localStorage !== 'undefined' &&
    (localStorage.getItem(localStorageKeys.lastUsedNetwork) as Networks)) ||
  Networks.Alfajores;
const lastUsedAddress =
  (typeof localStorage !== 'undefined' &&
    localStorage.getItem(localStorageKeys.lastUsedAddress)) ||
  '';

function Kit() {
  const [address, setAddress] = useState(lastUsedAddress);
  const [initialised, setInitialised] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [network, updateNetwork] = useState(lastUsedNetwork);

  const savedPrivateKey =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(localStorageKeys.privateKey);
  const initialKit = savedPrivateKey
    ? fromPrivateKey(network, savedPrivateKey)
    : newKit(getFornoUrl(network));

  const [kit, setKit] = useState(initialKit);

  useEffect(() => {
    if (kit.defaultAccount) {
      setAddress(kit.defaultAccount);
      localStorage.setItem(
        localStorageKeys.lastUsedAddress,
        kit.defaultAccount
      );
    }
  }, [kit]);

  useEffect(() => {
    localStorage.setItem(localStorageKeys.lastUsedNetwork, network);
    setKit((k) => {
      const existingWallet = k.getWallet();
      if (!existingWallet) {
        return newKit(getFornoUrl(network));
      }

      const nk = newKit(getFornoUrl(network), existingWallet);
      nk.defaultAccount = existingWallet.getAccounts()[0];
      return nk;
    });
  }, [network]);

  const destroy = useCallback(() => {
    localStorage.removeItem(localStorageKeys.privateKey);
    localStorage.removeItem(localStorageKeys.lastUsedAddress);
    setAddress('');
    setKit(newKit(getFornoUrl(network)));
    setInitialised(false);
  }, [network]);

  const updateKit = useCallback((k: ContractKit) => {
    setKit(k);
    setInitialised(true);
  }, []);

  const send = useCallback(
    async (
      tx: CeloTransactionObject<any> | CeloTransactionObject<any>[],
      sendOpts?: any
    ) => {
      if (!initialised) {
        setModalIsOpen(true);
        return;
      }

      const gasPriceMinimumContract = await kit.contracts.getGasPriceMinimum();
      const minGasPrice = await gasPriceMinimumContract.gasPriceMinimum();
      const gasPrice = minGasPrice.times(1.5);

      const txs = Array.isArray(tx) ? tx : [tx];
      return Promise.all(
        txs.map((t) => {
          return t.sendAndWaitForReceipt({
            ...sendOpts,
            from: address,
            gasPrice,
          });
        })
      );
    },
    [kit, address, initialised]
  );

  return {
    network,
    updateNetwork,
    fornoUrl: getFornoUrl(network),

    address,
    kit,
    destroy,

    send,

    updateKit,

    modalIsOpen,
    openModal: () => setModalIsOpen(true),
    closeModal: () => setModalIsOpen(false),
  };
}

const KitState = createContainer(Kit);
export const useContractKit = KitState.useContainer;

export function ContractKitProvider({
  children,
  reactModalProps,
  renderProvider,
  dappName,
}: {
  children: ReactNode;
  dappName: string;
  renderProvider?: (p: Provider & { onClick: () => void }) => ReactNode;
  reactModalProps?: Partial<ReactModal.Props>;
}) {
  return (
    <KitState.Provider>
      <Modal
        dappName={dappName}
        reactModalProps={reactModalProps}
        renderProvider={renderProvider}
      />
      {children}
    </KitState.Provider>
  );
}
