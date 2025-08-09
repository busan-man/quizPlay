import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Users, Trophy, Star, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-16">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 lg:mb-0"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                <span className="block">Make learning</span>
                <span className="block text-indigo-600">fun and engaging</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-3xl">
                Create interactive quizzes and games that students love to play. Boost engagement and see learning outcomes improve.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {isAuthenticated ? (
                  user?.role === 'teacher' ? (
                    <Link
                      to="/teacher/dashboard"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/student/join"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Join a Game
                    </Link>
                  )
                ) : (
                  <>
                    <Link
                      to="/auth/register?role=teacher"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Create a Quiz
                    </Link>
                    <Link
                      to="/auth/register?role=student"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Join as Student
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-w-5 aspect-h-3 rounded-lg bg-indigo-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-32 w-32 text-indigo-300" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
            >
              Supercharge your classroom
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto"
            >
              Engage students with interactive quizzes and game-based learning
            </motion.p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-indigo-100 p-3 inline-block">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Multiplayer Quizzes
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Bring competition into the classroom with real-time multiplayer quizzes.
              </p>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-purple-100 p-3 inline-block">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Leaderboards
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Track progress and celebrate success with real-time leaderboards.
              </p>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-blue-100 p-3 inline-block">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Game Modes
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Choose from various game modes to keep students engaged and excited.
              </p>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-green-100 p-3 inline-block">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Custom Questions
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Create your own question banks tailored to your curriculum.
              </p>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-yellow-100 p-3 inline-block">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Real-time Feedback
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Get instant insights into student understanding and performance.
              </p>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="rounded-md bg-red-100 p-3 inline-block">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Unity Games
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Enhance learning with interactive Unity-powered game experiences.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-white sm:text-4xl"
          >
            <span className="block">Ready to make learning fun?</span>
            <span className="block">Start creating quizzes today.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg leading-6 text-indigo-200"
          >
            Join thousands of teachers already using our platform to engage their students.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            {isAuthenticated ? (
              user?.role === 'teacher' ? (
                <Link
                  to="/teacher/create-quiz"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                >
                  Create a Quiz
                </Link>
              ) : (
                <Link
                  to="/student"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                >
                  Join a Game
                </Link>
              )
            ) : (
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
              >
                Sign up for free
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;