var path = require("path");
module.exports = {
	entry: {
		app: ["./app/js/main.js"]
	},
	output: {
		path: path.resolve(__dirname, "build"),
		publicPath: "/build/",
		filename: "globe.js"
	},
	module: {
		loaders: [
		{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			loader: 'babel',
			query: {
				presets: ['es2015']
			}
		}
		]
	}
};
