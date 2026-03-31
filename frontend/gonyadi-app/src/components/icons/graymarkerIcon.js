import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={18}
        height={18}
        viewBox="0 0 18 18"
        fill="none"
        {...props}
    >
        <Path
            fill="#818389"
            d="M9 1.5a6.375 6.375 0 0 1 4.867 10.492L13.86 12h.014l-3.783 4.016a1.5 1.5 0 0 1-2.184 0L4.125 12h.014l-.006-.008-.008-.009a6.338 6.338 0 0 1-1.5-4.108A6.375 6.375 0 0 1 9 1.5Zm0 4.125a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
        />
    </Svg>
)
export default SvgComponent
