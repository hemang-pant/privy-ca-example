import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import {
  clearCaAllowance,
  clearCaIntent,
  clearCaState,
  initializeCA,
  useAllowance,
  useBalance,
  useBridge,
  useCaIntent,
  useCaState,
  useTransfer,
} from "../components/ca";
import {
  Disclosure,
  Field,
  Input,
  Label,
  Select,
} from "@headlessui/react";
import {
  ArrowDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const router = useRouter();

  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
  } = usePrivy();
  const [showBalance, setShowBalance] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  let [intentModal, setIntentModal] = useState(useCaIntent());
  let allowanceModal = useAllowance();
  console.log("allowanceModal", allowanceModal);
  const [ txnHash, setTxnHash ] = useState("");

  const caState = useCaState();
  const [bridgeVal, setBridgeVal] = useState({
    amount: 0,
    chain: 0,
    token: "",
  });
  const [sendVal, setSendVal] = useState({
    amount: 0,
    chain: 0,
    token: "",
    to: "",
  });

  const bridge = async () => {
    console.log("bridge", bridgeVal);
    if (
      bridgeVal.amount > 0 &&
      bridgeVal.chain > 0 &&
      bridgeVal.token.length > 0
    ) {
      const res = await useBridge(
        bridgeVal.amount.toString(),
        bridgeVal.chain,
        bridgeVal.token,
        BigInt(0)
      );
      console.log("bridge res", res);
    }
  };

  const transfer = async () => {
    console.log("transfer", sendVal);
    if (
      sendVal.amount > 0 &&
      sendVal.chain > 0 &&
      sendVal.token.length > 0 &&
      sendVal.to.length > 0
    ) {
      sendVal.to = sendVal.to.replace("0x", "");
      const res = await useTransfer(
        sendVal.to,
        sendVal.amount.toString(),
        sendVal.token,
        sendVal.chain
      );
      console.log("transfer res", res);
      useBalance(true);
      setTxnHash(res as string);
      setIsCompletedOpen(true);
    }
  };

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const { ready: wReady, wallets } = useWallets();
  let balances = useBalance();
  useEffect(() => {
    if (wReady) {
      console.log(wallets);
      wallets[0]!.getEthereumProvider().then((p) => {
        initializeCA(p);
        console.log("CA SDK initialized", p);
        balances = useBalance();
      });
    }
  }, [wReady]);

  const [steps, setSteps] = useState([useCaState().steps]);
  const ifAllowance = async () => {
    try {
      useAllowance().open = false;
      const values = useAllowance().data.map(() => "1.15");
      console.log("values: ", values);
      const allowance = useAllowance();
      if (allowance && allowance.allow) {
        allowance.allow(values);
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const allowIntent = async () => {
    try {
      console.log("allow intent");
      useCaIntent().allow();
      setIsStepsOpen(true);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [isStepsOpen, setIsStepsOpen] = useState(false);
  const [isAllowanceOpen, setIsAllowanceOpen] = useState(false);
  console.log("isAllowanceOpen: ", isAllowanceOpen);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIntent = useCaIntent();
      if (currentIntent.open !== isIntentOpen) {
        setIsIntentOpen(currentIntent.open); // Track the open state
        setIntentModal(currentIntent);
        console.log("isIntentOpen: ",isIntentOpen);
        // Update the intentModal state
      }
      if (useAllowance().open) {
        console.log("Allowance Open");
        allowanceModal = useAllowance();
        ifAllowance();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isIntentOpen]);

  // useEffecct to track steps
  useEffect(() => {
    if (isStepsOpen) {
      console.log("STEP UPDATED");
      // update the steps 
      const currentSteps = useCaState().steps;
      setSteps([currentSteps]);
      const caState = useCaState();
      console.log("caState: ", caState);
      if (caState.completed) {
        console.log("came here");
      }
    }
  }, [caState, isStepsOpen, steps]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const wallet = user?.wallet;

  return (
    <>
      <Head>
        <title>Privy Auth Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              {email ? (
                <button
                  onClick={() => {
                    unlinkEmail(email.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink email
                </button>
              ) : (
                <button
                  onClick={linkEmail}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                >
                  Connect email
                </button>
              )}
              {wallet ? (
                <button
                  onClick={() => {
                    unlinkWallet(wallet.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink wallet
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect wallet
                </button>
              )}
              <button
                onClick={async () => {
                  if (showBalance) {
                    setShowBalance(false);
                    console.log("show balance", showBalance);
                  } else {
                    balances = await useBalance(true);
                    setShowBalance(true);
                    console.log("show balance", showBalance);
                  }
                }}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Show Unified Balance
              </button>
              <button
                onClick={() => {
                  if (showSend) {
                    clearCaIntent();
                    clearCaAllowance();
                    clearCaState();
                    setShowSend(false);
                    console.log("show send", showSend);
                  } else {
                    //display send modal
                    setShowSend(true);
                    setShowBridge(false);
                    clearCaIntent();
                    clearCaState();
                    clearCaAllowance();
                    setIsIntentOpen(false);
                    setIsStepsOpen(false);
                    setIsCompletedOpen(false);
                    setIsAllowanceOpen(false);
                    console.log("show send", showSend);
                  }
                }}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Send
              </button>
              {/* <button
                onClick={console.log("abcd")}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Show Steps
              </button> */}

              <button
                onClick={() => {
                  if (showBridge) {
                    setShowBridge(false);
                    clearCaIntent();
                    clearCaAllowance();
                    clearCaState();
                    console.log("show bridge", showBridge);
                  } else {
                    // display bridge modal
                    setShowBridge(true);
                    setShowSend(false);
                    clearCaIntent();
                    clearCaAllowance();
                    setIsIntentOpen(false);
                    clearCaState();
                    setIsStepsOpen(false);
                    setIsCompletedOpen(false);
                    setIsAllowanceOpen(false);
                    console.log("now run useBridge");
                    console.log("show bridge", showBridge);
                  }
                }}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Bridge
              </button>
            </div>
            {showBalance ? (
              <>
                <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                  Multi-chain, Unified Balance:{" "}
                  ${balances
                    ?.reduce((total, balance) => {
                      return total + (balance?.balanceInFiat || 0);
                    }, 0)
                    .toPrecision(3)}
                </p>
                <div className="w-full max-w-md rounded-2xl bg-white p-2">
                  {balances?.map((balance) => (
                    <Disclosure key={balance?.symbol} as="div" className="mt-2">
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500/75">
                            <span className="flex items-center gap-2">
                              <img
                                className="h-5 w-5 rounded-full"
                                src={balance?.icon}
                                alt="Privy Logo"
                              ></img>
                              {balance?.symbol}
                            </span>
                            <span className="flex flex-col items-end gap-1">
                              <div className="text-sm text-black">
                                {balance.balance} {balance?.symbol}
                              </div>
                              <div className="text-sm text-gray-500">
                                {balance.balanceInFiat} USD
                              </div>
                              <ChevronUpIcon
                                className={`${
                                  open ? "rotate-180 transform" : ""
                                } h-5 w-5 text-purple-500`}
                              />
                            </span>
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                            <div className="flex flex-col gap-2">
                              {balance?.breakdown.map((breakdown) => (
                                <div
                                  className="flex items-center gap-2 text-sm text-gray-500"
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <p className="text-sm text-gray-500 flex items-center gap-2">
                                    {
                                      <img
                                        className="h-5 w-5 rounded-full"
                                        src={breakdown.chain.logo}
                                        alt="Privy Logo"
                                      ></img>
                                    }
                                    {breakdown?.chain.name}
                                  </p>
                                  <p className="flex flex-col items-end gap-1">
                                    <p className="text-sm text-black">
                                      {breakdown?.balance} {balance?.symbol}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {breakdown?.balanceInFiat} USD
                                    </p>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </div>
              </>
            ) : (
              <div></div>
            )}
            {showBridge ? (
              <>
                <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                  Bridge Unified Balance
                </p>
                {isIntentOpen && (
                  <>
                    <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                      Intent Details
                    </p>
                    <div className="max-w-md rounded-md mt-2">
                      <span>
                        <div>Sources</div>
                        {intentModal.intent?.sources.map((source) => (
                          <div
                            className="flex items-center gap-2 text-sm text-gray-500"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              {
                                <img
                                  className="h-5 w-5 rounded-full"
                                  src={source.chainLogo}
                                  alt="Privy Logo"
                                ></img>
                              }
                              {source.chainName}
                            </p>
                            <p>
                              <p className="text-sm text-black">
                                {source.amount}{" "}
                                {intentModal.intent?.token.symbol}
                              </p>
                            </p>
                          </div>
                        ))}
                      </span>
                      <span
                        className="flex items-center gap-2 text-sm text-gray-500"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowDownIcon className="h-5 w-5 text-gray-500" />
                      </span>
                      <span>
                        <div>Destination</div>
                        <div
                          className="flex items-center gap-2 text-sm text-gray-500"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            {
                              <img
                                className="h-5 w-5 rounded-full"
                                src={intentModal.intent?.destination.chainLogo}
                                alt="Privy Logo"
                              ></img>
                            }
                            {intentModal.intent?.destination.chainName}
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {intentModal.intent?.destination.amount}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span>
                        <span></span>
                        <div
                          className="flex items-center gap-2"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-md flex items-center gap-2">
                            Total Fees:
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {intentModal.intent?.fees.total}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center text-gray-500 gap-2"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            CA Gas Fees:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.caGas}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Solver Fees:
                          </p>
                          <p>
                            <p className="text-sm ">
                              {intentModal.intent?.fees.solver}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Protocol Fees:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.protocol}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Gas Supplied:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.gasSupplied}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span>
                        <div
                          className="flex items-center gap-2 text-md "
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-md flex items-center gap-2">
                            Total at Destination
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {Number(intentModal.intent?.destination.amount) +
                                Number(intentModal.intent?.fees.total)}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <button
                          onClick={() => {
                            setIsIntentOpen(false);
                            clearCaIntent();
                            clearCaAllowance();
                            intentModal.deny();
                          }}
                          className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 mt-5"
                        >
                          Close
                        </button>
                        <button
                          onClick={allowIntent}
                          className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 mt-5"
                        >
                          Allow Intent
                        </button>
                      </span>
                    </div>
                  </>
                )}
                {!isIntentOpen && (
                  <>
                    <Field disabled>
                      <Label className="text-sm/6 font-medium text-black">
                        To
                      </Label>
                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="SELF"
                        onChange={(e) => {
                          console.log(e.target.value);
                        }}
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Amount
                      </Label>
                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="Amount"
                        onChange={(e) => {
                          console.log(e.target.value);
                          setBridgeVal({
                            ...bridgeVal,
                            amount: Number(e.target.value),
                          });
                        }}
                      />
                    </Field>

                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Token
                      </Label>
                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="USDC"
                        onChange={(e) => {
                          console.log(e.target.value);
                          setBridgeVal({
                            ...bridgeVal,
                            token: e.target.value,
                          });
                        }}
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Chain
                      </Label>
                      <div className="relative">
                        <Select
                          className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                          defaultValue="active"
                          onChange={(e) => {
                            console.log(e.target.value);
                            setBridgeVal({
                              ...bridgeVal,
                              chain: Number(e.target.value),
                            });
                          }}
                        >
                          <option value="0">Select Chain</option>
                          <option value="42161">Arbitrum One</option>
                          <option value="10">OP Mainnet</option>
                          <option value="8453">Base</option>
                          <option value="534532">Scroll</option>
                          <option value="137">Polygon POS</option>
                          <option value="1">Ethereum Mainnet</option>
                          <option value="59144">Linea</option>
                        </Select>
                      </div>
                      <div className="mt-5">
                        
                          <button
                            onClick={() => {
                              bridge();
                            }}
                            className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
                          >
                            Bridge
                          </button>
                        
                      </div>
                    </Field>
                  </>
                )}
              </>
            ) : (
              <></>
            )}
            {showSend ? (
              // transaction menu with to, chain, and token and amount
              
              <>
                <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                  Send Unified Balance
                </p>
                { // form Screen
                (!isIntentOpen && !isStepsOpen && !isCompletedOpen) && (
                  <>
                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        To
                      </Label>

                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="Enter Wallet Address"
                        onChange={(e) => {
                          setSendVal({
                            ...sendVal,
                            to: e.target.value,
                          });
                          console.log(e.target.value);
                        }}
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Amount
                      </Label>
                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="Amount"
                        onChange={(e) => {
                          console.log(e.target.value);
                          setSendVal({
                            ...sendVal,
                            amount: Number(e.target.value),
                          });
                        }}
                      />
                    </Field>

                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Token
                      </Label>
                      <Input
                        type="text"
                        className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                        placeholder="USDC"
                        onChange={(e) => {
                          console.log(e.target.value);
                          setSendVal({
                            ...sendVal,
                            token: e.target.value,
                          });
                        }}
                      />
                    </Field>
                    <Field>
                      <Label className="text-sm/6 font-medium text-black">
                        Chain
                      </Label>
                      <div className="relative">
                        <Select
                          className="mt-1 block w-half rounded-md bg-slate-700 text-white"
                          defaultValue="active"
                          onChange={(e) => {
                            console.log(e.target.value);
                            setSendVal({
                              ...sendVal,
                              chain: Number(e.target.value),
                            });
                          }}
                        >
                          <option value="0">Select Chain</option>
                          <option value="42161">Arbitrum One</option>
                          <option value="10">OP Mainnet</option>
                          <option value="8453">Base</option>
                          <option value="534532">Scroll</option>
                          <option value="137">Polygon POS</option>
                          <option value="1">Ethereum Mainnet</option>
                          <option value="59144">Linea</option>
                        </Select>
                      </div>
                      <div className="mt-5">
                        
                          <button
                            onClick={() => {
                              transfer();
                            }}
                            className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
                          >
                            Send
                          </button>
                      </div>
                    </Field>
                  </>
                )}
                { // intent Screen
                (isIntentOpen && !isStepsOpen && !isCompletedOpen) && (
                  <>
                    <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                      Intent Details
                    </p>
                    <div className="max-w-md rounded-md mt-2">
                      <span>
                        <div>Sources</div>
                        {intentModal.intent?.sources.map((source) => (
                          <div
                            className="flex items-center gap-2 text-sm mt-2 text-gray-500"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              {
                                <img
                                  className="h-5 w-5 rounded-full"
                                  src={source.chainLogo}
                                  alt="Privy Logo"
                                ></img>
                              }
                              {source.chainName}
                            </p>
                            <p>
                              <p className="text-sm text-black">
                                {source.amount}{" "}
                                {intentModal.intent?.token.symbol}
                              </p>
                            </p>
                          </div>
                        ))}
                      </span>
                      <span
                        className="flex items-center gap-2 text-sm text-gray-500"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowDownIcon className="h-5 w-5 text-gray-500" />
                      </span>
                      <span>
                        <div>Destination</div>
                        <div
                          className="flex items-center gap-2 text-sm mt-2 mb-3 text-gray-500"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            {
                              <img
                                className="h-5 w-5 rounded-full"
                                src={intentModal.intent?.destination.chainLogo}
                                alt="Privy Logo"
                              ></img>
                            }
                            {intentModal.intent?.destination.chainName}
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {sendVal.amount}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span>
                        <span></span>
                        <div
                          className="flex items-center gap-2"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-md flex items-center gap-2">
                            Total Fees:
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {intentModal.intent?.fees.total}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center text-gray-500 gap-2"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            CA Gas Fees:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.caGas}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Solver Fees:
                          </p>
                          <p>
                            <p className="text-sm ">
                              {intentModal.intent?.fees.solver}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Protocol Fees:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.protocol}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 text-gray-500 text-sm"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm flex items-center gap-2">
                            Gas Supplied:
                          </p>
                          <p>
                            <p className="text-sm">
                              {intentModal.intent?.fees.gasSupplied}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span>
                        <div
                          className="flex items-center gap-2 text-md "
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-md flex items-center gap-2">
                            Total Spend
                          </p>
                          <p>
                            <p className="text-sm text-black">
                              {intentModal.intent?.sourcesTotal}{" "}
                              {intentModal.intent?.token.symbol}
                            </p>
                          </p>
                        </div>
                      </span>
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <button
                          onClick={() => {
                            setIsIntentOpen(false);
                            clearCaIntent();
                            clearCaAllowance();
                            intentModal.deny();
                          }}
                          className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 mt-5"
                        >
                          Close
                        </button>
                        <button
                          onClick={allowIntent}
                          className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 mt-5"
                        >
                          Allow Intent
                        </button>
                      </span>
                    </div>
                  </>
                )}
                {
                  // steps screen
                  (isIntentOpen && isStepsOpen && !isCompletedOpen) && (
                  <>
                    <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                      Transaction Steps
                    </p>
                    <div className="max-w-md rounded-md mt-2">
                      {caState.steps.map((step) => (
                        <div
                          className="flex items-center gap-2 text-sm mt-2 text-gray-500"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            {
                              // check mark
                            }
                            {step.type}
                          </p>
                          <p>
                            <p className="text-sm text-black">
                            {step.done ? "✅" : "❌"}
                            </p>
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {
                  // successScreen
                  (isIntentOpen && isStepsOpen && isCompletedOpen) && (
                    <>
                    
                      <p className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Transaction Succcess!
                      </p>
                      <div className="max-w-md rounded-md mt-2">
                        <p className="text-sm text-black">
                          Intent Hash: {
                            caState.intentHash
                          }
                        </p>
                        <p className="text-sm text-black">
                          Explorer URL: {caState.explorerURL}
                        </p>
                        <p className="text-sm text-black">
                          Transaction Hash: {txnHash}
                        </p>
                        <button
                          onClick={() => {
                            setIsIntentOpen(false);
                            clearCaIntent();
                            clearCaAllowance();
                            clearCaState();
                            setIsStepsOpen(false);
                            setIsCompletedOpen(false);
                            setTxnHash("");
                            
                          }}
                          className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700 mt-5"
                        >
                          Close
                        </button>
                        </div>
                      
                    </>
                  )}
                

              </>
            ) : (
              <></>
            )}

            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}
      </main>
    </>
  );
}
