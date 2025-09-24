import styled from "styled-components";

const LoaderGis = () => {
  return (
    <StyledWrapper className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="loader">
        <span>GISTREEVIEW</span>
        <span>GISTREEVIEW</span>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  background: rgba(11, 1, 34, 0.73);

  .loader {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .loader span {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-size: 70px;
    font-weight: bold;
    letter-spacing: 2px;
    white-space: nowrap;
  }

  .loader span:nth-child(1) {
    color: transparent;
    -webkit-text-stroke: 0.3px #22c55e;
  }

  .loader span:nth-child(2) {
    color: #37c40dff;
    -webkit-text-stroke: 1px #0a5726ff;
    animation: uiverse723 3s ease-in-out infinite;
  }

  @keyframes uiverse723 {
    0%,
    100% {
      clip-path: polygon(
        0% 45%,
        15% 44%,
        32% 50%,
        54% 60%,
        70% 61%,
        84% 59%,
        100% 52%,
        100% 100%,
        0% 100%
      );
    }

    50% {
      clip-path: polygon(
        0% 60%,
        16% 65%,
        34% 66%,
        51% 62%,
        67% 50%,
        84% 45%,
        100% 46%,
        100% 100%,
        0% 100%
      );
    }
  }
`;

export default LoaderGis;
