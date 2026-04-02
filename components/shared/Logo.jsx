export default function Logo({ size = 22 }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      <defs>
        <mask id="nimbus-n">
          <rect width="32" height="32" fill="white" />
          <text
            x="16"
            y="27.5"
            textAnchor="middle"
            fontFamily="'Arial Black','Helvetica Neue',Arial,sans-serif"
            fontWeight="900"
            fontSize="32"
            fill="black"
          >
            N
          </text>
        </mask>
      </defs>
      <rect width="32" height="32" fill="white" mask="url(#nimbus-n)" />
    </svg>
  );
}
