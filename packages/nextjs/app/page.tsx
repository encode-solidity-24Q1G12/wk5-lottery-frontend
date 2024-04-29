"use client";

import Link from "next/link";
import type { NextPage } from "next";
import React, { useState } from 'react';
import { useSignMessage, useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, maxUint256 } from 'viem' 
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract,useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { Balance } from "~~/components/scaffold-eth";
import { abi } from "~~/LotteryToken.json"

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [signatureMessage, setSignatureMessage] = useState("");
  const [timeMessage, setTimeMessage] = useState("");
  const [dateString, setDateString ] = useState("");
  const [bstatusMessage, setBstatusMessage] = useState("");
  const [tokenMessage, setTokenMessage] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenToBurn, setTokenToBurn] = useState("");
  
  const contract = useDeployedContractInfo("Lottery");
  
  const betStatus = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betsOpen",
  });

  const closingTime = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betsClosingTime",
  });

  const { data: tokenAddress } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "paymentToken",
  });


  const {writeContractAsync:approvePayout} = useWriteContract();
  
  const data = useReadContract({
    address: tokenAddress,
    abi: [{
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: "balanceOf",
    args: [connectedAddress as string],
  });

  const { writeContractAsync:buyTokens } = useScaffoldWriteContract("Lottery");
  const { writeContractAsync:openBets } = useScaffoldWriteContract("Lottery");
  const { writeContractAsync:closeBets } = useScaffoldWriteContract("Lottery");
  const { writeContractAsync:burnTokens } = useScaffoldWriteContract("Lottery");

  function timeToString(){
    const datum = new Date(timeMessage);
      datum.toDateString();
      return datum;
  }

  return (
    <>
<div className="card bg-base-100 w-96">
  <div className="card-body">
    Open Bets:
    <label className="label cursor-pointer" id="lbl1">
    Time in Hours ({timeMessage}) 
    <input placeholder="Minutes" className="input input-bordered" 
    onChange={e => {setTimeMessage(String(BigInt(parseInt(e.target.value)*60*1000)+BigInt(Date.now())));
      const datum = new Date(timeMessage);
      const newDatum = datum.toDateString();
      setDateString(newDatum);

    }}
    />
    </label>
    <label className="label cursor-pointer" id="lbl2">{dateString}</label>
    <button className="btn btn-neutral" onClick={async ()=>{
      try {
        await openBets({
          functionName: "openBets",
          args: [BigInt(timeMessage)],
        });
      } catch (e) {
        console.error("Error:",e);
      }
    }}>Open Bets</button>
    <button className="btn btn-neutral" onClick={async ()=>{
      try {
        await closeBets({
          functionName: "closeLottery",
          account: connectedAddress as string,
        });
      } catch (e) {
        console.error("Error:",e);
      }
    }}>Close Bets</button>

  </div>
  </div>

  <div className="card bg-base-100 w-96">
  <div className="card-body">
    Buy Tokens:
    <label className="label cursor-pointer" id="lbl1">
    Change 
    <input placeholder="Eth" className="input input-bordered" 
    onChange={e => {setTokenMessage(e.target.value);}}
    /> ETH
    </label>
    <label className="label cursor-pointer" id="lbl2">{dateString}</label>
    <button className="btn btn-neutral" onClick={async ()=>{
      try {
        await buyTokens({
          functionName: "purchaseTokens",
          value: parseEther(tokenMessage as string),
          account: connectedAddress as string,
        });
      } catch (e) {
        console.error("Error:",e);
      }
    }}>Buy {parseInt(tokenMessage)*100} LOT</button>
  </div>
  </div>

<div className="card bg-base-100 w-96">
  <div className="card-body">
    Bets Status: {bstatusMessage}
    <label>
    Next closing: {"bigint" === typeof closingTime.data ? closingTime.data.toString() : "undefined"}
    </label>
    <button className="btn btn-neutral" onClick={()=>{
      betStatus.refetch()
      closingTime.refetch()
      if(betStatus.data){
       setBstatusMessage("Bets are open"); 
      }
      else{
        setBstatusMessage("Bets are closed"); 
      }
    }}>Check Status</button>
  </div>
</div>


<div className="card bg-base-100 w-96">
  <div className="card-body">
    TokenBalance: {tokenBalance}
    <button className="btn btn-neutral" onClick={()=>{
      data.refetch();
      if(typeof data.data === "bigint"){
       setTokenBalance(formatEther(data.data)); 
      }
      else{
        setTokenBalance("0"); 
      }
    }}>Check Balance</button>
    
    <button className="btn btn-neutral" onClick={async ()=>{
      try{
        await approvePayout({
          abi:[{
            "inputs": [
              {
                "internalType": "address",
                "name": "spender",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "internalType": "bool",
                "name": "",
                "type": "bool"
              }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
          }],
          functionName : "approve",
          address: String(tokenAddress),
          args: [String(contract.data.address), maxUint256],
        });
        await burnTokens({
          functionName: "returnTokens",
          args: [parseEther(tokenToBurn)],
        });
        data.refetch();
      } catch(e) {
        console.error(e);
      }
    }}>Withdraw</button>
    <label><input placeholder="Lot" className="input input-bordered" 
    onChange={e => {setTokenToBurn(e.target.value);}}
    /> LOT </label>
    

  </div>
</div>
    </>
  );
};

export default Home;
