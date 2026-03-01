import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glow?: boolean;
}

export function Card({ children, className = '', glow = false, ...props }: CardProps) {
    return (
        <div
            className={`glass-panel ${styles.card} ${glow ? styles.glow : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
