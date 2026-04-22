import { useState, useEffect } from 'react';
import {
  Dumbbell,
  Activity,
  Zap,
  TrendingUp,
  Target,
  Award,
  Heart,
  Sparkles,
  Brain,
  X,
  Check,
  ArrowRight,
  Star,
  Calendar as CalendarIcon
} from 'lucide-react';

const Section = ({ title, icon: Icon, children, gradient, delay = 0 }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} rounded-t-2xl`} />
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-xl font-bold text-white">{title}</h4>
      </div>
      {children}
    </div>
  );
};

const AIPlanCard = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Parsed Data Overview */}
      {plan.parsed_data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {plan.parsed_data.goal && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <p className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Goal</p>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {plan.parsed_data.goal.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {plan.parsed_data.duration && (
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Duration</p>
              </div>
              <p className="text-white font-bold text-lg">{plan.parsed_data.duration}</p>
            </div>
          )}

          {plan.parsed_data.fitness_level && (
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-green-400" />
                <p className="text-xs text-green-300 font-semibold uppercase tracking-wide">Level</p>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {plan.parsed_data.fitness_level}
              </p>
            </div>
          )}

          {plan.parsed_data.focus_area && (
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-xl p-4 border border-pink-500/30 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-pink-400" />
                <p className="text-xs text-pink-300 font-semibold uppercase tracking-wide">Focus</p>
              </div>
              <p className="text-white font-bold text-lg capitalize">
                {plan.parsed_data.focus_area}
              </p>
            </div>
          )}

        </div>
      )}

      {/* Daily Calories */}
      {plan.daily_calories && (
        <Section title="Daily Nutrition Target" icon={Zap} gradient="from-orange-500 to-red-500" delay={100}>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {plan.daily_calories}
            </p>
            <span className="text-gray-400 text-xl">kcal/day</span>
          </div>
          <p className="text-gray-400 mt-2 text-sm">
            Optimized for your goals and activity level
          </p>
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"
              style={{ width: '75%' }}
            />
          </div>
        </Section>
      )}

      {/* Weekly Workout Plan */}
      {plan.weekly_workout_plan?.length > 0 && (
        <Section title="Weekly Workout Plan" icon={CalendarIcon} gradient="from-purple-500 to-blue-500" delay={200}>
          <div className="space-y-3">
            {plan.weekly_workout_plan.map((day, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-black/40 to-gray-900/40 rounded-xl p-5 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    {day.day}
                  </h5>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">
                    {day.focus}
                  </span>
                </div>

                <ul className="space-y-2 mb-3">
                  {day.routine.map((exercise, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{exercise}</span>
                    </li>
                  ))}
                </ul>

                {day.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-gray-400 text-sm italic flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      {day.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
};

export default AIPlanCard;
