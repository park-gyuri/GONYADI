import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width={16}
        height={16}
        fill="none"
        {...props}
    >
        <Path
            fill="#43B0AB"
            d="M2 11.333h8a.667.667 0 0 1 .078 1.329l-.078.005H2a.666.666 0 0 1-.078-1.329L2 11.333Zm0-4h12a.666.666 0 0 1 .078 1.329L14 8.667H2a.667.667 0 0 1-.078-1.329L2 7.333Zm0-4h10a.666.666 0 0 1 .078 1.329L12 4.667H2a.667.667 0 0 1-.078-1.329L2 3.333Z"
        />
    </Svg>
)
export default SvgComponent
