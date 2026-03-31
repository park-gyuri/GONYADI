import * as React from "react"
import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={34}
        height={34}
        viewBox="0 0 34 34"
        fill="none"
        {...props}
    >
        <Path
            stroke={props.color || "#49454F"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m14.86 24.51-8.85 2.948 2.95-8.848m5.9 5.9 11.53-11.916a4.174 4.174 0 0 0-2.95-7.12c-1.107 0-2.168.44-2.95 1.222L8.96 18.61m5.9 5.9-5.9-5.9m2.949 2.95 8.565-8.966m-2.898-2.89 5.859 5.846"
        />
    </Svg>
)
export default SvgComponent
