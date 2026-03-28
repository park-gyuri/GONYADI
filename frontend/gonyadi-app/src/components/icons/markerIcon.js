import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <Path
            fill="#000"
            d="M12 2a8.5 8.5 0 0 1 8.5 8.5 8.465 8.465 0 0 1-2.01 5.49h-.001l-.008.01h.019l-5.044 5.355a2 2 0 0 1-2.912 0L5.5 16h.019l-.009-.01-.01-.013a8.45 8.45 0 0 1-2-5.477A8.5 8.5 0 0 1 12 2Zm0 5.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        />
    </Svg>
)
export default SvgComponent
