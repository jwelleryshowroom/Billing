
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { differenceInDays, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';

const MilestoneContext = createContext();

export const useMilestone = () => useContext(MilestoneContext);

// Milestones: 10k, 25k, 50k, 100k, 150k, 200k, 500k, 1M
const MILESTONES = [10000, 25000, 50000, 100000, 150000, 200000, 500000, 1000000];

export const MilestoneProvider = ({ children }) => {
    const { transactions } = useTransactions();
    const [celebration, setCelebration] = useState(null); // { milestone: 50000, daysTaken: 12, fasterBy: 2 } or null
    const [lastSeenMilestone, setLastSeenMilestone] = useState(() => {
        return Number(localStorage.getItem('tcc_last_milestone') || 0);
    });

    const totalSales = useMemo(() => {
        return transactions
            .filter(t => t.type === 'sale')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
    }, [transactions]);

    useEffect(() => {
        // Find the highest milestone currently achieved
        const achievedMilestone = MILESTONES.slice().reverse().find(m => totalSales >= m) || 0;

        // If we haven't seen *any* milestone yet, but the user is already way past some (e.g., total 60k),
        // we shouldn't spam them with 10k, 25k, 50k.
        // We just mark the current one as seen silently if it's the INITIAL load check.
        // However, checking "initial load" is tricky in effect.
        // Logic: Only celebrate if we are crossing into a *new* highest milestone that is strictly > lastSeen.

        if (achievedMilestone > lastSeenMilestone) {
            // Milestone Unlocked!

            // 1. Calculate Insights
            // Find WHEN we crossed it? Approximate by finding the first transaction that pushed total > milestone?
            // Expensive loop. Simplified: "Days since first sale" or "Days since last milestone".

            // Let's do "Days from start" for first milestone, and "Days from last milestone" for others?
            // Actually user asked: "10k in 2 days, 25k in 7 days". 
            // Better Metric: Days from first sale to NOW (or date of crossing).

            const salesTrans = transactions
                .filter(t => t.type === 'sale')
                .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first

            if (salesTrans.length === 0) return;

            const firstSaleDate = parseISO(salesTrans[0].date);
            const now = new Date();
            const daysTaken = differenceInDays(now, firstSaleDate) || 1; // Minimum 1 day

            // Prepare celebration data
            const eventData = {
                milestone: achievedMilestone,
                daysTaken: daysTaken,
                totalAmount: totalSales
            };

            setCelebration(eventData);
            setLastSeenMilestone(achievedMilestone);
            localStorage.setItem('tcc_last_milestone', achievedMilestone);

            // Trigger Confetti immediately
            fireConfetti();
        }

    }, [totalSales, lastSeenMilestone, transactions]);

    const fireConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const closeCelebration = () => {
        setCelebration(null);
    };

    return (
        <MilestoneContext.Provider value={{ celebration, closeCelebration }}>
            {children}
        </MilestoneContext.Provider>
    );
};
