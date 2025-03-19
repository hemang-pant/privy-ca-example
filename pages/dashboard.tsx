import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import { initializeCA, useBalance } from "../components/ca";



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
        balances = useBalance(true);
      });
    }
  }, [wReady]);

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
                onClick={
                  async () => {
                    if(showBalance){
                      setShowBalance(false)
                      console.log("show balance", showBalance)
                    }else{
                      balances = await useBalance(true)
                      setShowBalance(true)
                      console.log("show balance", showBalance)
                    }
                  }
                }
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Show Unified Balance
              </button>
              <button
                onClick={()=>{
                  if(showSend){
                    setShowSend(false)
                    console.log("show send", showSend)
                  }else{
                    setShowSend(true)
                    console.log("show send", showSend)
                  }
                }}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Send
              </button>
              <button
                onClick={
                  ()=>{
                    if(showBridge){
                      setShowBridge(false)
                      console.log("show bridge", showBridge)
                    }else{
                      setShowBridge(true)
                      console.log("show bridge", showBridge)
                    }
                  }
                }
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"  
              >
                Bridge
              </button>
            </div>
            { showBalance ? 
              <>
                 <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              Unified Balance
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(balances?.map(
                (b) => ({
                  symbol: b.symbol,
                  balance: b.balance.toString(),
                  balancesInUSD: b.balanceInFiat.toString(),
                  breakDown: Number(b.balance) > 0 ? b.breakdown?.map(
                    (t) => Number(t.balance) > 0 ? ({
                      balance: t.balance.toString(),
                      chainName: t.chain.name,
                      balanceInUSD: t.balanceInFiat.toString(),
                    })
                    : {}
                  ) : {},
                })
              ), null, 2)}
            </pre>
              </>
               : <div></div>
            }
            { showSend ? 
              <>
                <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              Send
            </p>

              
              </>
              : <div></div>
            }
            { showBridge ? 
              <>
                <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              Bridge
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(balances, null, 2)}
            </pre>
              </>
              : <div></div>
            }
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
