import * as React from "react"
import Svg, { Path } from "react-native-svg"

const SvgComponent = (props) => (
    <Svg
        width={23}
        height={23}
        viewBox="0 0 27 27"
        fill="none"
        {...props}
    >
        <Path
            fill="#000"
            d="M26.667 13.333c0 7.364-5.97 13.334-13.334 13.334S0 20.697 0 13.333 5.97 0 13.333 0v2.667a10.667 10.667 0 1 0 6 1.846V8h-2.666V0h8v2.667h-3.334a13.32 13.32 0 0 1 5.334 10.666Z"
        />
    </Svg>
)
export default SvgComponent