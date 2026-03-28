import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={32}
        fill="none"
        {...props}
    >
        <Path
            stroke="#000"
            strokeLinecap="round"
            strokeWidth={2.6}
            d="M16.013 9.733H16M16.013 16H16m.013 6.267H16"
        />
    </Svg>
)
export default SvgComponent
