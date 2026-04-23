import { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    AreaChart, Area
} from "recharts";
import { TrendingDown, TrendingUp, Target, Flame, Award, Calendar, Upload, X } from "lucide-react";
import api from '../services/api';
import AppNav from '../components/AppNav.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
    SkeletonStatCard, SkeletonProfileCard, SkeletonChartCard, SkeletonListItem
} from '../components/ui/Skeleton.jsx';

const Dashboard = () => {
    const showToast = useToast();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [goal, setGoal] = useState({
        targetWeight: 70,
        weeklyWorkouts: 5,
    });

    const [stats, setStats] = useState({
        currentWeight: 0,
        workoutsDone: 0,
        consistency: 0,
        caloriesBurned: 0,
        streak: 0
    });

    const [progressData, setProgressData] = useState([]);
    const [progressList, setProgressList] = useState([]);
    const [workoutSessions, setWorkoutSessions] = useState([]);
    const [netCalories, setNetCalories] = useState(null);
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const [dailyWorkout, setDailyWorkout] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            try {
                const profileData = await api.getFitnessProfile();
                setProfile(profileData);
                if (profileData.weight_kg) {
                    setStats(prev => ({ ...prev, currentWeight: profileData.weight_kg }));
                }
            } catch (err) {
                console.error('Profile fetch failed:', err);
            }

            try {
                const progress = await api.getProgressList();
                setProgressList(progress);
                if (progress && progress.length > 0) {
                    const chartData = progress
                        .sort((a, b) => new Date(a.recorded_on) - new Date(b.recorded_on))
                        .slice(-8)
                        .map((item, index) => ({
                            week: `W${index + 1}`,
                            weight: parseFloat(item.weight),
                            date: item.recorded_on
                        }));
                    setProgressData(chartData);
                    const latestProgress = progress[progress.length - 1];
                    setStats(prev => ({ ...prev, currentWeight: parseFloat(latestProgress.weight) }));
                }
            } catch (err) {
                console.error('Progress fetch failed:', err);
            }

            try {
                const sessions = await api.getWorkoutSessions();
                setWorkoutSessions(sessions);
                setStats(prev => ({ ...prev, workoutsDone: sessions?.length || 0 }));
                if (sessions && sessions.length > 0) {
                    const recentSessions = sessions.slice(-4);
                    const consistency = (recentSessions.length / 4) * 100;
                    setStats(prev => ({ ...prev, consistency: Math.round(consistency * 20) }));
                }
            } catch (err) {
                console.error('Workout sessions fetch failed:', err);
            }

            try {
                const workout = await api.getWorkout();
                setCurrentWorkout(workout);
                if (workout?.exercises) {
                    const tasks = workout.exercises.map((ex, idx) => ({
                        task: `${ex.name} - ${ex.sets}x${ex.reps} ${ex.rest_time ? `(${ex.rest_time}s rest)` : ''}`,
                        done: false,
                        id: ex.id || idx
                    }));
                    setDailyWorkout(tasks);
                }
            } catch (err) {
                console.error('Workout fetch failed:', err);
            }

            try {
                const calories = await api.getNetCalories();
                setNetCalories(calories);
                setStats(prev => ({ ...prev, caloriesBurned: calories?.calories_burned || 0 }));
            } catch (err) {
                console.error('Calories fetch failed:', err);
            }

        } catch (err) {
            setError(err.message);
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
            setLoadingProfile(false);
        }
    };

    const toggleWorkout = (index) => {
        setDailyWorkout(prev =>
            prev.map((item, i) => i === index ? { ...item, done: !item.done } : item)
        );
    };

    const handleProgressUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const progressData = {
                image: file,
                note: 'Progress photo',
                weight: stats.currentWeight,
                recorded_on: new Date().toISOString().split('T')[0]
            };
            await api.createProgress(progressData);
            showToast('Progress photo uploaded!', 'success');
            await fetchAllData();
        } catch (err) {
            console.error('Failed to upload progress:', err);
            showToast(err.message || 'Failed to upload progress photo', 'error');
        }
    };

    const handleDeleteProgress = async (progressId) => {
        if (!confirm('Are you sure you want to delete this progress entry?')) return;
        try {
            await api.deleteProgress(progressId);
            showToast('Progress entry deleted', 'info');
            await fetchAllData();
        } catch (err) {
            console.error('Failed to delete progress:', err);
            showToast(err.message || 'Failed to delete progress', 'error');
        }
    };

    const completedTasks = dailyWorkout.filter(task => task.done).length;
    const totalTasks = dailyWorkout.length;
    const dailyProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const initialWeight = progressData.length > 0 ? progressData[0].weight : stats.currentWeight;
    const weightLost = initialWeight - stats.currentWeight;
    const weightToGo = stats.currentWeight - goal.targetWeight;
    const overallProgress = weightToGo > 0 ? (weightLost / (weightLost + weightToGo)) * 100 : 0;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-8 max-w-md">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold transition-colors text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <AppNav />
            <div className="px-4 md:px-8 py-6 md:py-10">
            {/* Subtle background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <div className="mb-6 md:mb-10 animate-fade-in">
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent mb-1">
                        Fitness Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base">Track your progress. Stay consistent. Become unstoppable.</p>
                </div>

                {/* Profile Summary */}
                {loadingProfile ? (
                    <SkeletonProfileCard />
                ) : profile ? (
                    <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                            <div className="w-16 h-16 rounded-xl bg-violet-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                                {profile.gender?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white mb-1">Your Fitness Profile</h2>
                                <p className="text-gray-500 text-sm mb-4">Personalized data used to track progress & generate AI plans</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <ProfileItem label="Age" value={`${profile.age} yrs`} />
                                    <ProfileItem label="Gender" value={profile.gender} />
                                    <ProfileItem label="Height" value={`${profile.height_cm} cm`} />
                                    <ProfileItem label="Weight" value={`${profile.weight_kg} kg`} />
                                    <ProfileItem label="Goal" value={profile.fitness_goal?.replace("_", " ")} />
                                    <ProfileItem label="Level" value={profile.fitness_level} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    ) : (
                        <>
                            <StatCard
                                title="Current Weight"
                                value={`${stats.currentWeight} kg`}
                                icon={<TrendingDown className="w-5 h-5 text-violet-400" />}
                                trend={weightLost > 0 ? `-${weightLost.toFixed(1)} kg total` : "Start tracking"}
                                delay="0"
                            />
                            <StatCard
                                title="Workouts Done"
                                value={stats.workoutsDone}
                                icon={<Target className="w-5 h-5 text-violet-400" />}
                                trend={stats.workoutsDone > 0 ? "Keep going!" : "Start your journey"}
                                delay="75"
                            />
                            <StatCard
                                title="Consistency"
                                value={`${stats.consistency}%`}
                                icon={<Award className="w-5 h-5 text-violet-400" />}
                                trend={stats.consistency > 70 ? "Excellent!" : "Keep improving"}
                                delay="150"
                            />
                            <StatCard
                                title="Calories Burned"
                                value={stats.caloriesBurned}
                                icon={<Flame className="w-5 h-5 text-violet-400" />}
                                trend="Today"
                                delay="225"
                            />
                        </>
                    )}
                </div>

                {/* Progress Overview */}
                <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Overall Progress</h2>
                            <p className="text-gray-500 text-sm">Journey to your goal weight</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-5">
                        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Weight Lost</p>
                            <p className="text-3xl font-bold text-emerald-400">{Math.max(0, weightLost).toFixed(1)} <span className="text-base font-normal text-gray-500">kg</span></p>
                        </div>
                        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">To Goal</p>
                            <p className="text-3xl font-bold text-white">{Math.max(0, weightToGo).toFixed(1)} <span className="text-base font-normal text-gray-500">kg</span></p>
                        </div>
                        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Progress</p>
                            <p className="text-3xl font-bold text-violet-400">{Math.max(0, overallProgress).toFixed(0)}<span className="text-base font-normal text-gray-500">%</span></p>
                        </div>
                    </div>

                    <div className="relative w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                        >
                            <div className="absolute inset-0 overflow-hidden rounded-full">
                                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ width: '200%', left: '-100%' }}></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-right">{Math.max(0, overallProgress).toFixed(0)}% complete</p>
                </div>

                {/* Charts Grid */}
                {loading ? (
                    <div className="grid lg:grid-cols-2 gap-4 mb-6">
                        <SkeletonChartCard />
                        <SkeletonChartCard />
                    </div>
                ) : progressData.length > 0 && (
                    <div className="grid lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-emerald-400" />
                                Weight Progress
                            </h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={progressData}>
                                    <defs>
                                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fill="url(#weightGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                                <Award className="w-5 h-5 text-violet-400" />
                                Workout Sessions
                            </h2>
                            <div className="text-center py-10">
                                <div className="text-6xl font-bold text-violet-400 mb-1">
                                    {workoutSessions.length}
                                </div>
                                <p className="text-gray-500">Total sessions completed</p>
                                <div className="mt-5 inline-block bg-violet-500/10 border border-violet-500/20 rounded-xl px-5 py-2.5">
                                    <p className="text-sm text-gray-400">
                                        Consistency: <span className="text-violet-400 font-semibold">{stats.consistency}%</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Daily Workout Planner */}
                {dailyWorkout.length > 0 && (
                    <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-violet-400" />
                                Today's Workout Plan
                            </h2>
                            <span className="text-sm text-gray-500">
                                <span className="text-white font-semibold">{completedTasks}</span>/{totalTasks} done
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                    style={{ width: `${dailyProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <ul className="space-y-2">
                            {dailyWorkout.map((item, index) => (
                                <li
                                    key={index}
                                    onClick={() => toggleWorkout(index)}
                                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                        item.done
                                            ? "bg-emerald-500/10 border border-emerald-500/20"
                                            : "bg-gray-950 border border-gray-800 hover:border-gray-700"
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                        item.done
                                            ? "border-emerald-400 bg-emerald-400"
                                            : "border-gray-600"
                                    }`}>
                                        {item.done && <span className="text-white text-xs font-bold">✓</span>}
                                    </div>
                                    <span className={`text-sm font-medium transition-all ${
                                        item.done ? "line-through text-gray-600" : "text-gray-300"
                                    }`}>
                                        {item.task}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Progress Gallery */}
                <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800 hover:border-gray-700 transition-colors duration-300 animate-slide-up">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-violet-400" />
                        Progress Gallery
                    </h2>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProgressUpload}
                        className="mb-5 block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:text-sm file:font-medium hover:file:bg-violet-700 file:cursor-pointer file:transition-colors"
                    />

                    {progressList.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No progress photos yet. Upload your first one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {progressList.map((item) => (
                                <div key={item.id} className="relative group">
                                    <img
                                        src={item.images[0]?.image_url}
                                        alt="progress"
                                        className="rounded-xl h-36 w-full object-cover border border-gray-800 group-hover:border-gray-700 transition-all duration-200"
                                    />
                                    <button
                                        onClick={() => handleDeleteProgress(item.id)}
                                        className="absolute top-2 right-2 bg-gray-900 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-gray-700"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-gray-950/90 rounded-lg px-2 py-1 text-xs text-gray-400">
                                        {item.weight} kg
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-gray-950/90 rounded-lg px-2 py-1 text-xs text-gray-500">
                                        {new Date(item.recorded_on).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Insight */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 animate-slide-up">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-xl">
                            🤖
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">AI Insight</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {weightLost > 0 ? (
                                    <>You're <span className="text-emerald-400 font-medium">on track</span>. Weight is dropping steadily and consistency is {stats.consistency > 70 ? 'excellent' : 'improving'}. Maintain this momentum!</>
                                ) : (
                                    <>Start tracking your progress to get personalized insights. Upload progress photos and log your workouts!</>
                                )}
                            </p>

                            {netCalories && (
                                <div className="mt-4 bg-gray-950 rounded-xl p-4 border border-gray-800 inline-block">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today's Net Calories</p>
                                    <p className="text-2xl font-bold text-white">{netCalories.net_calories || 0} <span className="text-sm font-normal text-gray-500">cal</span></p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Consumed: {netCalories.calories_consumed || 0} &nbsp;·&nbsp; Burned: {netCalories.calories_burned || 0}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
            </div>
        </div>
    );
};

/* ---------- Sub-components ---------- */
const StatCard = ({ title, value, icon, trend, delay }) => (
    <div
        className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all duration-300 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                {icon}
            </div>
        </div>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-xs text-gray-600">{trend}</p>
    </div>
);

const ProfileItem = ({ label, value }) => (
    <div className="bg-gray-950 rounded-lg px-3 py-2.5 border border-gray-800">
        <p className="text-xs uppercase tracking-wide text-gray-600 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white capitalize">{value}</p>
    </div>
);

export default Dashboard;
