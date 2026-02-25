import React, { useRef, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { classesData } from '../constants/classesData';


const ClassesRoadmap: React.FC = () => {
    const containerRef = useRef<HTMLElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const carRef = useRef<SVGGElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const pathProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const smoothProgress = useSpring(pathProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // 1. Define Geometric Path Data
    const p = useMemo(() => {
        return [
            [-500, 180],  // Start
            [50, 180],    // 1. Turn Down (Starts very early)
            [50, 450],    // 2. Turn Right
            [300, 450],   // 3. Turn Up
            [300, 220],   // 4. Turn Right
            [550, 220],   // 5. Turn Down
            [550, 450],   // 6. Turn Right
            [780, 450],   // 7. Turn Up
            [780, 280],   // 8. Turn Right
            [1500, 280]   // End
        ];
    }, []);

    // Radius for rounded corners
    const R = 40;

    // 2. Generate SVG Path
    const svgPath = useMemo(() => {
        if (!p || p.length < 2) return "";
        let d = `M ${p[0][0]} ${p[0][1]}`;

        for (let i = 1; i < p.length - 1; i++) {
            const current = p[i];
            const prev = p[i - 1];
            const next = p[i + 1];

            // Calculate directions
            const fromX = current[0] - prev[0];
            const fromY = current[1] - prev[1];
            const toX = next[0] - current[0];
            const toY = next[1] - current[1];

            // Normalized directions
            const nFromX = fromX !== 0 ? fromX / Math.abs(fromX) : 0;
            const nFromY = fromY !== 0 ? fromY / Math.abs(fromY) : 0;
            const nToX = toX !== 0 ? toX / Math.abs(toX) : 0;
            const nToY = toY !== 0 ? toY / Math.abs(toY) : 0;

            // Line to start of curve
            d += ` L ${current[0] - nFromX * R} ${current[1] - nFromY * R}`;
            // Curve
            d += ` Q ${current[0]} ${current[1]} ${current[0] + nToX * R} ${current[1] + nToY * R}`;
        }

        // Final line to end point
        d += ` L ${p[p.length - 1][0]} ${p[p.length - 1][1]}`;
        return d;
    }, [p]);

    // 3. Animate car along the SVG path (2D, same coordinate system = perfect alignment)
    useEffect(() => {
        const updateCar = (value: number) => {
            if (!pathRef.current || !carRef.current) return;

            const pathLength = pathRef.current.getTotalLength();
            const t = Math.max(0, Math.min(1, value));
            const point = pathRef.current.getPointAtLength(t * pathLength);

            // Get tangent direction from a nearby point
            const delta = pathLength * 0.002;
            const nextPoint = pathRef.current.getPointAtLength(
                Math.min(pathLength, t * pathLength + delta)
            );
            const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

            carRef.current.setAttribute('transform',
                `translate(${point.x}, ${point.y}) rotate(${angle})`
            );

            // Car fades in over the first 5% of path progress
            const opacity = Math.min(1, t * 20);
            carRef.current.style.opacity = opacity.toString();
        };

        // Set initial position
        updateCar(smoothProgress.get());

        // Subscribe to scroll changes
        const unsubscribe = smoothProgress.on("change", updateCar);
        return () => unsubscribe();
    }, [smoothProgress]);


    return (
        <section ref={containerRef} className="h-[300vh] relative bg-white">
            {/* Sticky Container */}
            <div className="sticky top-16 h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4">
                <div className="w-full max-w-[1400px] h-full bg-[#f3f6fb] rounded-[3rem] shadow-xl relative overflow-hidden border border-gray-100 flex flex-col justify-center">
                    <h2 className="text-4xl font-bold text-center mb-8 text-[#1a1a2e] absolute top-8 w-full z-10">
                        Your Learning Journey
                    </h2>

                    <div className="w-full h-[85%] relative mt-12">
                        {/* SVG Layer (Road + Car) */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 1000 600"
                                className="w-full h-full"
                                preserveAspectRatio="xMidYMid meet"
                                style={{ overflow: 'visible' }}
                            >
                                {/* Road Border/Shadow */}
                                <path
                                    d={svgPath}
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth="90"
                                    strokeLinecap="butt"
                                    strokeLinejoin="round"
                                />
                                {/* Road Base (Dark Gray) */}
                                <path
                                    d={svgPath}
                                    fill="none"
                                    stroke="#1e293b"
                                    strokeWidth="80"
                                    strokeLinecap="butt"
                                    strokeLinejoin="round"
                                />
                                {/* Inner Dashed Line (White) */}
                                <path
                                    d={svgPath}
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="6"
                                    strokeDasharray="30 40"
                                    strokeLinecap="butt"
                                    strokeLinejoin="round"
                                />

                                {/* Invisible path for car position tracking */}
                                <path
                                    ref={pathRef}
                                    d={svgPath}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="0"
                                />

                                {/* Gradient definitions for realistic car */}
                                <defs>
                                    <linearGradient id="carBodyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="40%" stopColor="#dc2626" />
                                        <stop offset="100%" stopColor="#991b1b" />
                                    </linearGradient>
                                    <linearGradient id="carBodySheen" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                                        <stop offset="45%" stopColor="white" stopOpacity="0.15" />
                                        <stop offset="55%" stopColor="white" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="windshieldGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#93c5fd" />
                                        <stop offset="50%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#1d4ed8" />
                                    </linearGradient>
                                    <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#b91c1c" />
                                        <stop offset="50%" stopColor="#991b1b" />
                                        <stop offset="100%" stopColor="#7f1d1d" />
                                    </linearGradient>
                                    <radialGradient id="headlightGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#fef9c3" />
                                        <stop offset="60%" stopColor="#fde047" />
                                        <stop offset="100%" stopColor="#facc15" stopOpacity="0.3" />
                                    </radialGradient>
                                    <radialGradient id="taillightGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#fca5a5" />
                                        <stop offset="60%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.4" />
                                    </radialGradient>
                                    <linearGradient id="wheelGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#374151" />
                                        <stop offset="50%" stopColor="#111827" />
                                        <stop offset="100%" stopColor="#374151" />
                                    </linearGradient>
                                </defs>

                                {/* 2D Car - realistic detailed top-down view */}
                                <g ref={carRef} style={{ filter: 'drop-shadow(2px 5px 5px rgba(0,0,0,0.4))' }}>
                                    {/* Ground shadow beneath the car */}
                                    <ellipse cx="0" cy="1" rx="20" ry="11" fill="rgba(0,0,0,0.12)" />

                                    {/* === WHEELS (behind body) === */}
                                    {/* Front-left tire */}
                                    <rect x="10" y="-15" width="9" height="5" rx="2" fill="url(#wheelGrad)" stroke="#1f2937" strokeWidth="0.5" />
                                    <rect x="11.5" y="-14" width="6" height="3" rx="1" fill="#6b7280" opacity="0.3" />
                                    {/* Front-right tire */}
                                    <rect x="10" y="10" width="9" height="5" rx="2" fill="url(#wheelGrad)" stroke="#1f2937" strokeWidth="0.5" />
                                    <rect x="11.5" y="11" width="6" height="3" rx="1" fill="#6b7280" opacity="0.3" />
                                    {/* Rear-left tire */}
                                    <rect x="-19" y="-15" width="9" height="5" rx="2" fill="url(#wheelGrad)" stroke="#1f2937" strokeWidth="0.5" />
                                    <rect x="-17.5" y="-14" width="6" height="3" rx="1" fill="#6b7280" opacity="0.3" />
                                    {/* Rear-right tire */}
                                    <rect x="-19" y="10" width="9" height="5" rx="2" fill="url(#wheelGrad)" stroke="#1f2937" strokeWidth="0.5" />
                                    <rect x="-17.5" y="11" width="6" height="3" rx="1" fill="#6b7280" opacity="0.3" />

                                    {/* === CAR BODY === */}
                                    <rect x="-20" y="-11" width="40" height="22" rx="7" fill="url(#carBodyGrad)" stroke="#991b1b" strokeWidth="0.5" />
                                    {/* Metallic sheen */}
                                    <rect x="-20" y="-11" width="40" height="22" rx="7" fill="url(#carBodySheen)" />

                                    {/* Front bumper shape */}
                                    <path d="M 17,-9 Q 22,-9 22,-4 L 22,4 Q 22,9 17,9" fill="#b91c1c" stroke="#991b1b" strokeWidth="0.3" />
                                    {/* Rear bumper shape */}
                                    <path d="M -17,-9 Q -22,-9 -22,-4 L -22,4 Q -22,9 -17,9" fill="#b91c1c" stroke="#991b1b" strokeWidth="0.3" />

                                    {/* Chrome trim line along sides */}
                                    <line x1="-16" y1="-11" x2="16" y2="-11" stroke="#fbbf24" strokeWidth="0.6" opacity="0.5" />
                                    <line x1="-16" y1="11" x2="16" y2="11" stroke="#fbbf24" strokeWidth="0.6" opacity="0.5" />

                                    {/* === CABIN / ROOF === */}
                                    <rect x="-8" y="-8" width="20" height="16" rx="4" fill="url(#roofGrad)" />

                                    {/* Windshield (front glass) */}
                                    <rect x="6" y="-7" width="7" height="14" rx="2.5" fill="url(#windshieldGrad)" opacity="0.7" />
                                    {/* Windshield reflection */}
                                    <rect x="8" y="-5" width="2" height="10" rx="1" fill="white" opacity="0.2" />

                                    {/* Rear window */}
                                    <rect x="-9" y="-6" width="5" height="12" rx="2" fill="url(#windshieldGrad)" opacity="0.5" />
                                    {/* Rear window reflection */}
                                    <rect x="-8" y="-4" width="1.5" height="8" rx="0.75" fill="white" opacity="0.15" />

                                    {/* Roof highlight */}
                                    <rect x="-2" y="-5" width="8" height="3" rx="1.5" fill="white" opacity="0.08" />

                                    {/* === SIDE MIRRORS === */}
                                    <ellipse cx="8" cy="-13" rx="2.5" ry="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.3" />
                                    <ellipse cx="8" cy="13" rx="2.5" ry="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.3" />

                                    {/* === HEADLIGHTS === */}
                                    <circle cx="20" cy="-6" r="3.5" fill="url(#headlightGlow)" opacity="0.6" />
                                    <circle cx="20" cy="6" r="3.5" fill="url(#headlightGlow)" opacity="0.6" />
                                    <ellipse cx="20" cy="-6" rx="2" ry="1.8" fill="#fef9c3" />
                                    <ellipse cx="20" cy="6" rx="2" ry="1.8" fill="#fef9c3" />

                                    {/* === TAILLIGHTS === */}
                                    <circle cx="-20" cy="-5" r="2.5" fill="url(#taillightGlow)" opacity="0.5" />
                                    <circle cx="-20" cy="5" r="2.5" fill="url(#taillightGlow)" opacity="0.5" />
                                    <ellipse cx="-20" cy="-5" rx="1.5" ry="1.3" fill="#fca5a5" />
                                    <ellipse cx="-20" cy="5" rx="1.5" ry="1.3" fill="#fca5a5" />

                                    {/* === EXHAUST PIPES === */}
                                    <circle cx="-22" cy="-3" r="1" fill="#4b5563" stroke="#374151" strokeWidth="0.3" />
                                    <circle cx="-22" cy="3" r="1" fill="#4b5563" stroke="#374151" strokeWidth="0.3" />
                                    <circle cx="-22" cy="-3" r="0.5" fill="#1f2937" />
                                    <circle cx="-22" cy="3" r="0.5" fill="#1f2937" />
                                </g>
                            </svg>
                        </div>

                        {/* Markers Layer */}
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            <div className="w-full h-full relative">
                                {classesData.map((cls, index) => {
                                    const positions = [
                                        { left: '4%', top: '15%' },   // 1
                                        { left: '17%', top: '45%' },   // 2
                                        { left: '19%', top: '85%' },  // 3
                                        { left: '42%', top: '85%' },  // 4
                                        { left: '38%', top: '22%' },  // 5
                                        { left: '54%', top: '22%' },  // 6
                                        { left: '54%', top: '85%' },  // 7
                                        { left: '78%', top: '60%' },  // 8
                                        { left: '88%', top: '47%' },  // 9
                                        { left: '98%', top: '47%' }   // 10
                                    ];

                                    const pos = positions[index] || { left: '0', top: '0' };
                                    const isEven = index % 2 === 0;

                                    return (
                                        <motion.div
                                            key={cls.id}
                                            style={{ left: pos.left, top: pos.top }}
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                                            initial={{ opacity: 0, scale: 0 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Link to={`/class/${cls.id}`} className="relative group block">
                                                {/* Marker */}
                                                <div className={`w-14 h-14 bg-white rounded-full border-4 ${isEven ? 'border-orange-500' : 'border-blue-500'} shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20 relative`}>
                                                    <span className="text-gray-800 font-bold text-lg">{cls.id}</span>
                                                </div>

                                                {/* Tooltip Label */}
                                                <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 px-3 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30`}>
                                                    <span className="font-bold text-white text-sm">{cls.label}</span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClassesRoadmap;
