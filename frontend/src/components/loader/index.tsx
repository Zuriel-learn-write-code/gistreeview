import React from "react";
import styled, { keyframes } from "styled-components";

// Keyframes untuk animasi rotasi
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
`;

// Styled components
const LoaderContainer = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
`;

const Circle = styled.div`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid;
  border-radius: 50%;
  animation: ${spin} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #22c55e transparent transparent transparent;

  &:nth-child(1) {
    animation-delay: -0.45s;
  }

  &:nth-child(2) {
    animation-delay: -0.3s;
  }

  &:nth-child(3) {
    animation-delay: -0.15s;
  }
`;

const InnerCircle = styled.div`
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 48px;
  height: 48px;
  margin: 16px;
  border: 6px solid;
  border-radius: 50%;
  animation: ${spinReverse} 1s linear infinite;
  border-color: transparent transparent #22c55e transparent;
`;

const LoaderGis: React.FC = () => {
  return (
    <LoaderContainer>
      <Circle />
      <Circle />
      <Circle />
      <InnerCircle />
    </LoaderContainer>
  );
};

export default LoaderGis;
