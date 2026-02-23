import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Curve, Vector3 } from 'three';

interface CarProps {
    pathProgress: any; // visual progress (motion value or number)
    curve: Curve<Vector3>;
}

const Car: React.FC<CarProps> = ({ pathProgress, curve }) => {
    const group = useRef<any>(null);


    // Helper to safely get progress value
    const getProgress = () => {
        if (pathProgress && typeof pathProgress.get === 'function') {
            return pathProgress.get();
        }
        return typeof pathProgress === 'number' ? pathProgress : 0;
    };

    useFrame(() => {
        if (!group.current || !curve) return;

        const progress = getProgress();

        // 1. Get position and orientation
        const t = Math.max(0, Math.min(1, progress));
        const position = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();

        // 2. Position car at the center of the road (no lane offset)
        group.current.position.copy(position);

        // Orient car along the tangent direction
        group.current.up.set(0, 0, 1);
        const lookTarget = position.clone().add(tangent);
        group.current.lookAt(lookTarget);
    });

    return (
        // Increased scale from 0.25 to 0.8 for better visibility
        <group ref={group} scale={[0.8, 0.8, 0.8]}>
            {/* Car Body */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.5, 4]} />
                <meshStandardMaterial color="#dc2626" />
            </mesh>

            {/* Cabin */}
            <mesh position={[0, 1, -0.5]} castShadow>
                <boxGeometry args={[1.5, 0.6, 2]} />
                <meshStandardMaterial color="#b91c1c" />
            </mesh>

            {/* Windows */}
            <mesh position={[0, 1.05, -0.5]}>
                <boxGeometry args={[1.55, 0.55, 2.05]} />
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
            </mesh>


            {/* Wheels */}
            <group position={[1, 0.25, 1.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
            <group position={[-1, 0.25, 1.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
            <group position={[1, 0.25, -1.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
            <group position={[-1, 0.25, -1.2]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>

            {/* Headlights */}
            <mesh position={[0.6, 0.5, 2]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 16]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
            </mesh>
            <mesh position={[-0.6, 0.5, 2]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 16]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
            </mesh>

        </group>
    );
};

export default Car;
