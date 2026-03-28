import Svg, { Path, Circle } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={24}
        height={24}
        fill="none"
        {...props}
    >
        <Circle cx="11" cy="11" r="7" stroke={props.color || "#43B0AB"} strokeWidth="2" />
        <Path stroke={props.color || "#43B0AB"} strokeWidth="2" strokeLinecap="round" d="M20 20l-4-4" />
    </Svg>
)
export default SvgComponent
