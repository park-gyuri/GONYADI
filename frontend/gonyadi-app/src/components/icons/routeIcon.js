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
            d="m15 21-6-2.1-4.65 1.8a.904.904 0 0 1-.925-.112A.987.987 0 0 1 3 19.75v-14c0-.217.063-.408.188-.575.125-.167.296-.292.512-.375L9 3l6 2.1 4.65-1.8a.902.902 0 0 1 .925.113.988.988 0 0 1 .425.837v14a.934.934 0 0 1-.187.575 1.125 1.125 0 0 1-.513.375L15 21Zm-1-2.45V6.85l-4-1.4v11.7l4 1.4Z"
        />
    </Svg>
)
export default SvgComponent
