import * as React from "react"
import Svg, { Path } from "react-native-svg"

const StarIcon = ({ isFilled, size = 24, color = "#43B0AB", ...props }) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={isFilled ? color : "none"}
    stroke={isFilled ? color : color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
)

export default StarIcon;
