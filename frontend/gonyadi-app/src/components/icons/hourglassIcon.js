import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={12}
        height={17}
        fill="none"
        {...props}
    >
        <Path
            fill="#43B0AB"
            fillRule="evenodd"
            d="M0 1a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1Zm0 15a1 1 0 0 1 1-1h10a1 1 0 0 1 0 2H1a1 1 0 0 1-1-1Z"
            clipRule="evenodd"
        />
    </Svg>
)
export default SvgComponent
