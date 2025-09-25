"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import io from "socket.io-client";
import { database } from "../config/firebase";
import { ref, onValue } from "firebase/database";

const socket = io("http://localhost:5000");

const Home = () => {
  const [dateTime, setDateTime] = useState<string>("");
  const [tokens, setTokens] = useState<string>("BXQWE");
  const [hideShow, setHideShow] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dataRef = ref(database, "activation");
    console.log("DEBUG here 1");
    const unsubscribe = onValue(dataRef, async (snapshot) => {
      const fetchData = snapshot.val();
      console.log("DEBUG here 2");
      if (fetchData) {
        setIsEnabled(fetchData.enabled);
        console.log("DEBUG here 3: " + fetchData.enabled);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("isEnabled state changed:", isEnabled);

    if (isEnabled) {
      // Signal backend to generate voucher
      fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Voucher requested, backend responded:", data);
        })
        .catch((err) => console.error("Error generating voucher:", err));
    }
  }, [isEnabled]);

  useEffect(() => {
    socket.on("connect", () => console.log("Connected to WebSocket Server"));

    socket.on("voucherTokens", (data) => {
      console.log("Received Voucher Token:", data);
      setTokens(data);
      setHideShow(true);
      setCountdown(60);

      if (countdownRef.current) clearInterval(countdownRef.current);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setHideShow(false);
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      socket.off("voucherTokens");
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const Procedures = [
    {
      src: "/images/step1.jpg",
      alt: "Procedure 1",
      title: "Step 1: Waste Collection",
      desc: "Smart bins collect waste and send data to the central system.",
    },
    {
      src: "/images/step2.jpg",
      alt: "Procedure 2",
      title: "Step 2: Data Processing",
      desc: "The system analyzes waste levels using IoT and sensors.",
    },
    {
      src: "/images/step3.jpg",
      alt: "Procedure 3",
      title: "Step 3: Redeems tokens",
      desc: "Use your voucher tokens to connect to the WiFi.",
    },
  ];

  // For circular progress
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (countdown / 60) * circumference;

  return (
    <div className="relative bg-blue-300 items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Date/Time */}
      <div className="absolute top-4 right-6 text-sm text-gray-700 font-medium bg-white px-3 py-1 rounded-lg shadow">
        {dateTime}
      </div>

      {/* Title */}
      <h1 className="text-4xl p-4 font-bold text-center text-black">
        Smart Waste Management System
      </h1>
      <p className="text-lg p-2 font-medium text-center text-black">
        Monitor and manage waste efficiently with real-time data and analytics.
      </p>

      {/* Procedure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {Procedures.map((step, index) => (
          <Card
            key={index}
            className="p-6 mt-4 bg-white shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300"
          >
            <CardHeader className="flex flex-col items-center">
              <Image
                src={step.src}
                alt={step.alt}
                width={300}
                height={300}
                className="rounded-lg"
              />
              <CardTitle className="mt-4 text-xl font-semibold text-center">
                {step.title}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-center text-gray-700">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voucher Tokens with Circular Countdown */}
      <div
        className={`flex flex-col items-center mt-8 transform transition-all duration-500 ease-in-out origin-top ${
          hideShow
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <h2 className="text-center p-4 text-4xl font-semibold text-black">
          VOUCHER TOKENS
        </h2>

        <div className="relative flex items-center justify-center w-[120px] h-[120px]">
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#d1d5db"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#3b82f6"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{
                strokeDashoffset,
                transition: "stroke-dashoffset 1s linear",
              }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xl font-medium text-gray-700">
            {tokens}
          </span>
        </div>

        <p className="text-center text-gray-500 font-medium mt-2">
          Hiding in {countdown} second{countdown !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default Home;
