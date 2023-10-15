import { ShaderView } from "./shader_view";
import simple_plasma from "@/lib/shaders/simple_plasma.wgsl";

export const Home = () => {
  return <ShaderView shaderCode={simple_plasma} />;
};

export default Home;
