import ThemeToggle from "./ThemeToggle";
interface LoadingPageProps {
    onLogin: () => void;
}
function LandingPage({ onLogin }: LoadingPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 antialiased">
            {" "}
            {/* Navigation */}{" "}
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="flex justify-between items-center py-4">
                        {" "}
                        <div className="flex items-center space-x-3">
                            {" "}
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                {" "}
                                <span className="text-white font-bold text-lg">
                                    T
                                </span>{" "}
                            </div>{" "}
                            <div className="flex flex-col">
                                {" "}
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    TinkFlow
                                </h1>{" "}
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    AI Learning Platform
                                </p>{" "}
                            </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-4">
                            {" "}
                            <ThemeToggle />{" "}
                            <button
                                onClick={onLogin}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                {" "}
                                Get Started{" "}
                            </button>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </nav>{" "}
            {/* Hero Section */}{" "}
            <section className="relative overflow-hidden">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
                    {" "}
                    <div className="text-center">
                        {" "}
                        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full mb-8">
                            {" "}
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>{" "}
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                                AI-Powered Concept Learning
                            </span>{" "}
                        </div>{" "}
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            {" "}
                            Learn & Tinker with{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block">
                                {" "}
                                AI-Powered Concepts{" "}
                            </span>{" "}
                        </h1>{" "}
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                            {" "}
                            TinkFlow is the ultimate AI-powered platform for
                            exploring, understanding, and experimenting with new
                            concepts. Transform your learning journey with
                            interactive visual flows and intelligent insights.{" "}
                        </p>{" "}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {" "}
                            <button
                                onClick={onLogin}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                {" "}
                                Start Learning Now{" "}
                            </button>{" "}
                            <button className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                                {" "}
                                Watch Demo{" "}
                            </button>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
                {/* Background Elements */}{" "}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>{" "}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-10 blur-2xl"></div>{" "}
            </section>{" "}
            {/* Features Section */}{" "}
            <section className="py-20 bg-white dark:bg-gray-800">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="text-center mb-16">
                        {" "}
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {" "}
                            Everything You Need to Learn{" "}
                        </h2>{" "}
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {" "}
                            AI-powered tools and features designed to accelerate
                            your learning and conceptual understanding{" "}
                        </p>{" "}
                    </div>{" "}
                    <div className="grid md:grid-cols-3 gap-8">
                        {" "}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-8 rounded-2xl hover:shadow-lg transition-all duration-200 border border-indigo-200 dark:border-indigo-700/50 hover:transform hover:-translate-y-1">
                            {" "}
                            <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center mb-6">
                                {" "}
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />{" "}
                                </svg>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                AI-Powered Insights{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Get intelligent explanations and connections
                                between concepts powered by advanced AI that
                                understands your learning style.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-8 rounded-2xl hover:shadow-lg transition-all duration-200 border border-purple-200 dark:border-purple-700/50 hover:transform hover:-translate-y-1">
                            {" "}
                            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                                {" "}
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                                    />{" "}
                                </svg>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                Interactive Visual Flows{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Build and explore concept maps with interactive
                                nodes that respond to your curiosity and create
                                dynamic learning pathways.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-8 rounded-2xl hover:shadow-lg transition-all duration-200 border border-green-200 dark:border-green-700/50 hover:transform hover:-translate-y-1">
                            {" "}
                            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-6">
                                {" "}
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                    />{" "}
                                </svg>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                Experimentation Sandbox{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Tinker with concepts in a safe, guided
                                environment where you can test ideas and see
                                instant results with AI feedback.{" "}
                            </p>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </section>{" "}
            {/* How It Works Section */}{" "}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="text-center mb-16">
                        {" "}
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {" "}
                            How TinkFlow Works{" "}
                        </h2>{" "}
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {" "}
                            Three simple steps to unlock your learning potential
                            with AI-powered concept exploration{" "}
                        </p>{" "}
                    </div>{" "}
                    <div className="grid md:grid-cols-3 gap-8">
                        {" "}
                        <div className="text-center">
                            {" "}
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                {" "}
                                <span className="text-white font-bold text-xl">
                                    1
                                </span>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                Input Your Concept{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Start by entering any topic, question, or
                                concept you want to explore. Our AI understands
                                context and complexity.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="text-center">
                            {" "}
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                {" "}
                                <span className="text-white font-bold text-xl">
                                    2
                                </span>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                AI Generates Flow{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Watch as TinkFlow creates an interactive visual
                                map with connected nodes, each representing key
                                aspects of your concept.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div className="text-center">
                            {" "}
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                {" "}
                                <span className="text-white font-bold text-xl">
                                    3
                                </span>{" "}
                            </div>{" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {" "}
                                Explore & Learn{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {" "}
                                Click on any node to dive deeper, ask questions,
                                and watch new connections emerge as you explore
                                your learning path.{" "}
                            </p>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </section>{" "}
            {/* Stats Section */}{" "}
            <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        {" "}
                        <div className="text-white">
                            {" "}
                            <div className="text-4xl font-bold mb-2">
                                27K+
                            </div>{" "}
                            <div className="text-indigo-100">
                                Concepts Explored
                            </div>{" "}
                        </div>{" "}
                        <div className="text-white">
                            {" "}
                            <div className="text-4xl font-bold mb-2">
                                2.4K+
                            </div>{" "}
                            <div className="text-indigo-100">
                                Active Learners
                            </div>{" "}
                        </div>{" "}
                        <div className="text-white">
                            {" "}
                            <div className="text-4xl font-bold mb-2">
                                98%
                            </div>{" "}
                            <div className="text-indigo-100">
                                Learning Success
                            </div>{" "}
                        </div>{" "}
                        <div className="text-white">
                            {" "}
                            <div className="text-4xl font-bold mb-2">
                                24/7
                            </div>{" "}
                            <div className="text-indigo-100">AI Support</div>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </section>{" "}
            {/* Use Cases Section */}{" "}
            <section className="py-20 bg-white dark:bg-gray-800">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="text-center mb-16">
                        {" "}
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {" "}
                            Perfect for Every Learning Style{" "}
                        </h2>{" "}
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {" "}
                            Whether you're a student, researcher, or curious
                            mind, TinkFlow adapts to your learning needs{" "}
                        </p>{" "}
                    </div>{" "}
                    <div className="grid md:grid-cols-2 gap-8">
                        {" "}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10 p-8 rounded-2xl border border-blue-200 dark:border-blue-700/30">
                            {" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {" "}
                                🎓 Academic Learning{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {" "}
                                Break down complex academic subjects into
                                digestible, interconnected concepts. Perfect for
                                studying sciences, humanities, and technical
                                topics.{" "}
                            </p>{" "}
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                {" "}
                                <li>• Research paper analysis</li>{" "}
                                <li>• Concept mapping for exams</li>{" "}
                                <li>• Cross-disciplinary connections</li>{" "}
                            </ul>{" "}
                        </div>{" "}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 p-8 rounded-2xl border border-purple-200 dark:border-purple-700/30">
                            {" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {" "}
                                💡 Creative Exploration{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {" "}
                                Explore ideas, brainstorm solutions, and
                                discover unexpected connections. Great for
                                creative professionals and innovators.{" "}
                            </p>{" "}
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                {" "}
                                <li>• Idea generation workflows</li>{" "}
                                <li>• Problem-solving frameworks</li>{" "}
                                <li>• Innovation mapping</li>{" "}
                            </ul>{" "}
                        </div>{" "}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 p-8 rounded-2xl border border-green-200 dark:border-green-700/30">
                            {" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {" "}
                                🔬 Technical Deep Dives{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {" "}
                                Understand complex systems, architectures, and
                                technologies through interactive exploration and
                                AI-guided explanations.{" "}
                            </p>{" "}
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                {" "}
                                <li>• System architecture learning</li>{" "}
                                <li>• Technology stack exploration</li>{" "}
                                <li>• Code concept mapping</li>{" "}
                            </ul>{" "}
                        </div>{" "}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-800/10 p-8 rounded-2xl border border-orange-200 dark:border-orange-700/30">
                            {" "}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {" "}
                                🚀 Professional Development{" "}
                            </h3>{" "}
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {" "}
                                Build skills, understand industry trends, and
                                create learning paths for career advancement
                                with AI-powered insights.{" "}
                            </p>{" "}
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                {" "}
                                <li>• Skill gap analysis</li>{" "}
                                <li>• Career pathway planning</li>{" "}
                                <li>• Industry trend mapping</li>{" "}
                            </ul>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </section>{" "}
            {/* CTA Section */}{" "}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                {" "}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {" "}
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        {" "}
                        Ready to Transform Your Learning?{" "}
                    </h2>{" "}
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
                        {" "}
                        Join thousands of learners who are already exploring
                        concepts in revolutionary ways with TinkFlow's
                        AI-powered platform.{" "}
                    </p>{" "}
                    <button
                        onClick={onLogin}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-12 py-4 rounded-xl text-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        {" "}
                        Start Learning for Free{" "}
                    </button>{" "}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        {" "}
                        No credit card required • Get started in seconds{" "}
                    </p>{" "}
                </div>{" "}
            </section>{" "}
            {/* Footer */}{" "}
            <footer className="bg-gray-900 text-white py-12">
                {" "}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {" "}
                    <div className="grid md:grid-cols-4 gap-8">
                        {" "}
                        <div className="col-span-1">
                            {" "}
                            <div className="flex items-center space-x-3 mb-4">
                                {" "}
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    {" "}
                                    <span className="text-white font-bold text-sm">
                                        T
                                    </span>{" "}
                                </div>{" "}
                                <span className="text-xl font-bold">
                                    TinkFlow
                                </span>{" "}
                            </div>{" "}
                            <p className="text-gray-400 text-sm">
                                {" "}
                                AI-powered concept learning platform for curious
                                minds.{" "}
                            </p>{" "}
                        </div>{" "}
                        <div>
                            {" "}
                            <h4 className="font-semibold mb-4">Product</h4>{" "}
                            <ul className="space-y-2 text-gray-400 text-sm">
                                {" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Features
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Pricing
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        API
                                    </a>
                                </li>{" "}
                            </ul>{" "}
                        </div>{" "}
                        <div>
                            {" "}
                            <h4 className="font-semibold mb-4">
                                Resources
                            </h4>{" "}
                            <ul className="space-y-2 text-gray-400 text-sm">
                                {" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Documentation
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Tutorials
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Blog
                                    </a>
                                </li>{" "}
                            </ul>{" "}
                        </div>{" "}
                        <div>
                            {" "}
                            <h4 className="font-semibold mb-4">Company</h4>{" "}
                            <ul className="space-y-2 text-gray-400 text-sm">
                                {" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        About
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>{" "}
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Privacy
                                    </a>
                                </li>{" "}
                            </ul>{" "}
                        </div>{" "}
                    </div>{" "}
                    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                        {" "}
                        <p className="text-gray-400 text-sm">
                            {" "}
                            © 2025 TinkFlow. All rights reserved.{" "}
                        </p>{" "}
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            {" "}
                            <a
                                href="#"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {" "}
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />{" "}
                                </svg>{" "}
                            </a>{" "}
                            <a
                                href="#"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {" "}
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />{" "}
                                </svg>{" "}
                            </a>{" "}
                            <a
                                href="#"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                {" "}
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {" "}
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.747.099.12.112.225.085.344-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.001 12.017z" />{" "}
                                </svg>{" "}
                            </a>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </footer>{" "}
        </div>
    );
}
export default LandingPage;
