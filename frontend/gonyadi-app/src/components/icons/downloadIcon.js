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
            fill="#107676"
            d="M22.12 12H20V5.333C20 4.6 19.4 4 18.667 4h-5.334C12.6 4 12 4.6 12 5.333V12H9.88c-1.187 0-1.787 1.44-.947 2.28l6.12 6.12c.52.52 1.36.52 1.88 0l6.12-6.12c.84-.84.254-2.28-.933-2.28ZM6.667 25.333c0 .734.6 1.334 1.333 1.334h16c.733 0 1.333-.6 1.333-1.334 0-.733-.6-1.333-1.333-1.333H8c-.733 0-1.333.6-1.333 1.333Z"
        />
    </Svg>
)
export default SvgComponent
