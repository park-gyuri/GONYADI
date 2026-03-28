import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={21}
        height={26}
        viewBox="0 0 21 26"
        fill="none"
        {...props}
    >
        <Path
            stroke="#A9E2D9"
            strokeWidth={2}
            d="M11.896 1H6.333c-2.514 0-3.77 0-4.552.782C1 2.563 1 3.819 1 6.334v13.333c0 2.515 0 3.77.781 4.552C2.563 25 3.82 25 6.333 25h8c2.515 0 3.771 0 4.552-.781.782-.781.782-2.037.782-4.552V8.771c0-.544 0-.817-.102-1.061-.101-.244-.293-.439-.68-.824l-5.104-5.104c-.386-.387-.578-.579-.822-.68C12.713 1 12.44 1 11.896 1Z"
        />
    </Svg>
)
export default SvgComponent
