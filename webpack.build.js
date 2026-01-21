import Path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

export default {
    target: "web",
    devtool: "source-map",
    mode: "development",
    entry: Path.resolve(__dirname, "src/Main.ts"),
    output: {
        filename: "[name].js",
        path: Path.resolve(__dirname, "public/asset/js"),
        publicPath: "/asset/js/"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        fallback: {
            fs: false
        }
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                use: [
                    {
                        loader: "esbuild-loader",
                        options: {
                            loader: "ts",
                            tsconfig: Path.resolve(__dirname, "tsconfig.json")
                        }
                    }
                ],
                include: /(src)/,
                exclude: /(dist|node_modules|public)/
            },
            {
                test: /\.(tsx)$/,
                use: [
                    {
                        loader: "esbuild-loader",
                        options: {
                            loader: "tsx",
                            tsconfig: Path.resolve(__dirname, "tsconfig.json")
                        }
                    }
                ],
                include: /(src\/view)/,
                exclude: /(dist|node_modules|public)/
            }
        ]
    },
    performance: {
        hints: false
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                exclude: /(dist|node_modules|public)/,
                parallel: true,
                terserOptions: {
                    ecma: undefined,
                    parse: {},
                    compress: {},
                    mangle: true,
                    module: false
                }
            })
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            IS_DEPLOY_DEV: JSON.stringify(process.env.IS_DEPLOY_DEV)
        }),
        new HtmlWebpackPlugin({
            template: Path.resolve(__dirname, "template_index.html"),
            filename: Path.resolve(__dirname, "public/index.html"),
            inject: false,
            minify: false,
            templateParameters: {
                name: "App jsMvcFw",
                urlRoot: "",
                dateNow: Date.now()
            }
        }),
        new CompressionPlugin({
            algorithm: "gzip",
            test: /\.(js|jsx|css|html)$/,
            threshold: 10240,
            minRatio: 0.8
        })
    ]
};
