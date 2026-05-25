import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={20}
        height={20}
        fill="none"
        {...props}
    >
        <Path
            fill="#43B0AB"
            d="M9.292 2.833 6.192 7.9A.832.832 0 0 0 6.9 9.167h6.192c.65 0 1.05-.717.708-1.267l-3.092-5.067a.828.828 0 0 0-1.416 0ZM14.583 18.333a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM3.333 17.917h5a.836.836 0 0 0 .834-.834v-5a.836.836 0 0 0-.834-.833h-5a.836.836 0 0 0-.833.833v5c0 .459.375.834.833.834Z"
        />
    </Svg>
)
export default SvgComponent