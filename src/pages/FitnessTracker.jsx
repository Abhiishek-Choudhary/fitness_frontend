import React, { useState } from 'react';
import { Activity, Dumbbell, Camera, Plus, TrendingUp, Flame, Target, Calendar, Sparkles, Play, Upload, CheckCircle, XCircle, Video, AlertCircle, Images } from 'lucide-react';
import AppNav from '../components/AppNav.jsx';
import api from '../services/api.js';

const TAB_BANNERS = {
  progress: {
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=320&fit=crop&q=80',
    title: 'Track Your Progress',
    subtitle: 'Every workout logged brings you closer to your goal',
  },
  workouts: {
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=320&fit=crop&q=80',
    title: 'Your Workout Plan',
    subtitle: 'AI-crafted routines to maximise every session',
  },
  posture: {
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=320&fit=crop&q=80',
    title: 'Posture & Form Analysis',
    subtitle: 'Perfect your technique to prevent injury and perform better',
  },
  calories: {
    url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=320&fit=crop&q=80',
    title: 'Calorie & Nutrition Tracker',
    subtitle: 'Fuel your body right — snap a meal, get instant insights',
  },
};

const TabBanner = ({ tab }) => {
  const { url, title, subtitle } = TAB_BANNERS[tab] ?? {};
  if (!url) return null;
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-5">
      <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
      <div className="relative z-10 flex flex-col justify-center h-full px-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-300 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

export default function FitnessTracker({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('progress');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workouts, setWorkouts] = useState([
    {
      id: 1,
      name: 'Morning Cardio',
      exercises: [
        { name: 'Burpees', sets: 3, reps: 15, rest: '60s' },
        { name: 'Mountain Climbers', sets: 3, reps: 20, rest: '45s' },
        { name: 'Jumping Jacks', sets: 3, reps: 30, rest: '30s' }
      ],
      duration: 30,
      completed: true
    },
    {
      id: 2,
      name: 'Upper Body Blast',
      exercises: [
        { name: 'Push-ups', sets: 4, reps: 12, rest: '60s' },
        { name: 'Plank', sets: 3, reps: '60s', rest: '45s' },
        { name: 'Dumbbell Rows', sets: 3, reps: 10, rest: '60s' }
      ],
      duration: 45,
      completed: false
    },
    {
      id: 3,
      name: 'Leg Day Power',
      exercises: [
        { name: 'Squats', sets: 4, reps: 15, rest: '90s' },
        { name: 'Lunges', sets: 3, reps: 12, rest: '60s' },
        { name: 'Wall Sit', sets: 3, reps: '45s', rest: '60s' }
      ],
      duration: 50,
      completed: false
    }
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [workoutError, setWorkoutError] = useState('');

  // Calorie AI state
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [calorieResult, setCalorieResult] = useState(null);
  const [calorieError, setCalorieError] = useState('');
  const [savingToLog, setSavingToLog] = useState(false);
  const [savedToLog, setSavedToLog] = useState(false);

  // Posture AI state
  const [postureImages, setPostureImages] = useState([]);
  const [postureUploading, setPostureUploading] = useState(false);
  const [postureAnalyzing, setPostureAnalyzing] = useState(false);
  const [postureAnalysis, setPostureAnalysis] = useState(null);
  const [postureError, setPostureError] = useState('');

  const exerciseLibrary = {
    'Push-ups': {
      video: 'https://www.youtube.com/embed/IODxDxX7oi4',
      difficulty: 'Beginner',
      muscles: 'Chest, Triceps, Shoulders',
      description: 'A fundamental upper body exercise that builds strength in your chest, arms, and core.',
      tips: ['Keep your body in a straight line', 'Lower until chest nearly touches ground', 'Exhale as you push up'],
      benefits: ['Builds upper body strength', 'Improves core stability', 'No equipment needed']
    },
    'Squats': {
      video: 'https://www.youtube.com/embed/aclHkVaku9U',
      difficulty: 'Beginner',
      muscles: 'Quads, Glutes, Hamstrings',
      description: 'The king of leg exercises. Squats build overall lower body strength and power.',
      tips: ['Keep knees behind toes', 'Push through your heels', 'Keep chest up and back straight'],
      benefits: ['Builds leg strength', 'Improves mobility', 'Boosts metabolism']
    },
    'Plank': {
      video: 'https://www.youtube.com/embed/pSHjTRCQxIw',
      difficulty: 'Beginner',
      muscles: 'Core, Abs, Shoulders',
      description: 'An isometric core exercise that builds stability and endurance throughout your midsection.',
      tips: ['Keep body in straight line', 'Engage your core', "Don't let hips sag"],
      benefits: ['Strengthens core', 'Improves posture', 'Reduces back pain']
    },
    'Lunges': {
      video: 'https://www.youtube.com/embed/QOVaHwm-Q6U',
      difficulty: 'Intermediate',
      muscles: 'Quads, Glutes, Hamstrings',
      description: 'A unilateral leg exercise that improves balance while building leg strength.',
      tips: ['Step forward with control', 'Keep front knee at 90 degrees', 'Push back through front heel'],
      benefits: ['Improves balance', 'Builds leg strength', 'Enhances coordination']
    },
    'Burpees': {
      video: 'https://www.youtube.com/embed/dZgVxmf6jkA',
      difficulty: 'Advanced',
      muscles: 'Full Body, Cardio',
      description: 'A high-intensity full body exercise that combines strength and cardio for maximum calorie burn.',
      tips: ['Land softly', 'Keep core tight', 'Maintain steady breathing rhythm'],
      benefits: ['Burns maximum calories', 'Builds endurance', 'Strengthens entire body']
    },
    'Mountain Climbers': {
      video: 'https://www.youtube.com/embed/nmwgirgXLYM',
      difficulty: 'Intermediate',
      muscles: 'Core, Cardio, Shoulders',
      description: 'A dynamic exercise that combines core work with cardiovascular conditioning.',
      tips: ['Keep hips level', 'Drive knees toward chest', 'Maintain plank position'],
      benefits: ['Improves cardio', 'Strengthens core', 'Burns calories fast']
    },
    'Jumping Jacks': {
      video: 'https://www.youtube.com/embed/c4DAnQ6DtF8',
      difficulty: 'Beginner',
      muscles: 'Full Body, Cardio',
      description: 'A classic cardio exercise that gets your heart rate up and warms up your entire body.',
      tips: ['Land softly on balls of feet', 'Keep movements controlled', 'Breathe rhythmically'],
      benefits: ['Great warm-up', 'Improves coordination', 'Boosts heart health']
    },
    'Dumbbell Rows': {
      video: 'https://www.youtube.com/embed/pYcpY20QaE8',
      difficulty: 'Intermediate',
      muscles: 'Back, Biceps, Core',
      description: 'A pulling exercise that builds a strong, muscular back and improves posture.',
      tips: ['Keep back flat', 'Pull elbow past torso', 'Squeeze shoulder blades'],
      benefits: ['Builds back strength', 'Improves posture', 'Balances push exercises']
    },
    'Wall Sit': {
      video: 'https://www.youtube.com/embed/y-wV4Venusw',
      difficulty: 'Beginner',
      muscles: 'Quads, Glutes, Calves',
      description: 'An isometric leg exercise that builds muscular endurance in your lower body.',
      tips: ['Keep knees at 90 degrees', 'Press back against wall', 'Hold position steady'],
      benefits: ['Builds leg endurance', 'Strengthens knees', 'No equipment needed']
    }
  };

  const stats = {
    caloriesBurned: 2847,
    calorieGoal: 3000,
    workoutsCompleted: 18,
    weeklyGoal: 5,
    currentStreak: 12,
    totalWorkouts: 47
  };

  /* ── Calorie AI ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    setAnalyzing(true);
    setCalorieResult(null);
    setCalorieError('');
    setSavedToLog(false);

    try {
      const result = await api.estimateCalories(file);
      setCalorieResult(result);
    } catch (err) {
      setCalorieError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Save calorie result to food log ── */
  const handleSaveToLog = async () => {
    if (!calorieResult) return;
    setSavingToLog(true);
    try {
      const entry = {
        food_name: calorieResult.food_name || calorieResult.food || calorieResult.detected_food || 'Analyzed meal',
        calories:  Number(calorieResult.calories ?? calorieResult.total_calories ?? 0),
        protein:   Number(calorieResult.protein  ?? calorieResult.protein_g ?? 0),
        carbs:     Number(calorieResult.carbs     ?? calorieResult.carbohydrates ?? calorieResult.carbs_g ?? 0),
        fat:       Number(calorieResult.fat       ?? calorieResult.fats ?? calorieResult.fat_g ?? 0),
      };
      await api.bulkSaveFoodLog({ entries: [entry] });
      setSavedToLog(true);
    } catch (err) {
      setCalorieError(err.message || 'Failed to save to food log.');
    } finally {
      setSavingToLog(false);
    }
  };

  /* ── Posture AI ── */
  const handlePostureImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setPostureImages(files);
    setPostureAnalysis(null);
    setPostureError('');
  };

  const handlePostureAnalyze = async () => {
    if (postureImages.length < 3) {
      setPostureError('Please upload at least 3 push-up images for accurate analysis.');
      return;
    }
    setPostureError('');
    setPostureUploading(true);

    try {
      const uploadResult = await api.uploadPostureImages(postureImages);

      // Backend may use any of these field names for the session ID
      const sessionId =
        uploadResult.session_id ??
        uploadResult.id ??
        uploadResult.sessionId ??
        uploadResult.session ??
        uploadResult.upload_id;

      if (!sessionId && sessionId !== 0) {
        console.error('Upload response:', uploadResult);
        throw new Error(
          `Upload succeeded but no session ID was found in the response. ` +
          `Got keys: ${Object.keys(uploadResult).join(', ')}`
        );
      }

      setPostureUploading(false);
      setPostureAnalyzing(true);

      const analysis = await api.analyzePosture(sessionId);
      setPostureAnalysis(analysis);
    } catch (err) {
      setPostureError(err.message || 'Posture analysis failed. Please try again.');
    } finally {
      setPostureUploading(false);
      setPostureAnalyzing(false);
    }
  };

  /* ── Workout Agent ── */
  const generateWorkout = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingWorkout(true);
    setWorkoutError('');

    try {
      const result = await api.getEnrichedWorkout({ prompt: aiPrompt });

      // Backend returns enriched workout with YouTube links per exercise
      const exercises = (result.exercises || result.workout || []).map((ex, idx) => ({
        name: ex.name || ex.exercise || `Exercise ${idx + 1}`,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        rest: ex.rest || ex.rest_time || '60s',
        video: ex.youtube_url || ex.video_url || null,
        description: ex.description || '',
        muscles: ex.muscles || ex.muscle_groups || '',
      }));

      const newWorkout = {
        id: workouts.length + 1,
        name: result.name || result.workout_name || aiPrompt,
        exercises,
        duration: result.duration || result.total_duration || 30,
        completed: false,
      };
      setWorkouts([...workouts, newWorkout]);
      setAiPrompt('');
    } catch (err) {
      setWorkoutError(err.message || 'Failed to generate workout. Please try again.');
    } finally {
      setGeneratingWorkout(false);
    }
  };

  const tabs = [
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'posture', label: 'Posture', icon: Activity },
    { id: 'calories', label: 'Calories', icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppNav onLogout={onLogout} />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-1">Your Fitness Journey</h1>
          <p className="text-gray-500 text-sm">Track, plan, and conquer your goals</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4 animate-fade-in">
            <TabBanner tab="progress" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{stats.caloriesBurned}</span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Calories Burned Today</p>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.caloriesBurned / stats.calorieGoal) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Goal: {stats.calorieGoal}</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">{stats.workoutsCompleted}/5</span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Weekly Workouts</p>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.workoutsCompleted / stats.weeklyGoal) * 10}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Goal: {stats.weeklyGoal} per week</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <span className="text-2xl font-bold text-white">{stats.currentStreak}</span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Day Streak</p>
                <p className="text-xs text-gray-600">Total: {stats.totalWorkouts} workouts logged</p>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Weekly Activity
              </h3>
              <div className="flex items-end justify-around h-40 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const height = Math.random() * 75 + 25;
                  return (
                    <div key={day} className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className="w-full bg-violet-600 hover:bg-violet-500 rounded-t-lg transition-colors duration-200 cursor-default"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-600">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <div className="space-y-4 animate-fade-in">
            <TabBanner tab="workouts" />
            {/* AI Workout Generator */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                AI Workout Generator
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Full body HIIT for beginners'"
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && generateWorkout()}
                  disabled={generatingWorkout}
                />
                <button
                  onClick={generateWorkout}
                  disabled={generatingWorkout || !aiPrompt.trim()}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingWorkout ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {generatingWorkout ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {workoutError && (
                <div className="flex items-center gap-2 mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {workoutError}
                </div>
              )}
            </div>

            {/* Workout List */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-gray-500" />
                Your Workouts
              </h3>
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{workout.name}</h4>
                        {workout.completed && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Done</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" />
                          {workout.exercises.length} exercises
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {workout.duration} min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedWorkout(selectedWorkout === workout.id ? null : workout.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                    >
                      {selectedWorkout === workout.id ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {/* Exercise Details */}
                  {selectedWorkout === workout.id && (
                    <div className="border-t border-gray-800 p-4 space-y-2 animate-fade-in">
                      {workout.exercises.map((exercise, idx) => (
                        <div key={idx} className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <h5 className="text-sm font-medium text-white">{exercise.name}</h5>
                            <button
                              onClick={() => setSelectedExercise(selectedExercise === exercise.name ? null : exercise.name)}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs border border-gray-700 transition-all flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              {selectedExercise === exercise.name ? 'Hide' : 'Learn'}
                            </button>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>{exercise.sets} sets</span>
                            <span>·</span>
                            <span>{exercise.reps} reps</span>
                            <span>·</span>
                            <span>{exercise.rest} rest</span>
                          </div>

                          {selectedExercise === exercise.name && (
                            <div className="mt-3 space-y-3 animate-fade-in">
                              {/* Video: enriched API URL first, fall back to local library */}
                              {(exercise.video || exerciseLibrary[exercise.name]?.video) && (
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={exercise.video || exerciseLibrary[exercise.name].video}
                                    title={exercise.name}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}

                              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 space-y-2">
                                {(exercise.muscles || exerciseLibrary[exercise.name]?.muscles) && (
                                  <div className="flex gap-2">
                                    {exerciseLibrary[exercise.name]?.difficulty && (
                                      <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full text-xs border border-gray-700">
                                        {exerciseLibrary[exercise.name].difficulty}
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full text-xs border border-gray-700">
                                      {exercise.muscles || exerciseLibrary[exercise.name].muscles}
                                    </span>
                                  </div>
                                )}
                                {(exercise.description || exerciseLibrary[exercise.name]?.description) && (
                                  <p className="text-xs text-gray-400 leading-relaxed">
                                    {exercise.description || exerciseLibrary[exercise.name].description}
                                  </p>
                                )}
                                {exerciseLibrary[exercise.name]?.tips && (
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-400 mb-1.5">Form Tips</p>
                                    <ul className="space-y-1">
                                      {exerciseLibrary[exercise.name].tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                                          <span className="text-emerald-500 mt-0.5">·</span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posture Tab */}
        {activeTab === 'posture' && (
          <div className="space-y-4 animate-fade-in">
            <TabBanner tab="posture" />
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                AI Push-Up Form Analyzer
              </h3>
              <p className="text-gray-500 text-sm mb-1">Upload <span className="text-white font-medium">3 or more</span> push-up photos from different angles</p>
              <p className="text-xs text-gray-600 mb-5">The AI will score your form and give detailed feedback on each aspect</p>

              {/* Image upload area */}
              <div className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center hover:border-gray-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePostureImageSelect}
                  className="hidden"
                  id="postureUpload"
                />
                <label htmlFor="postureUpload" className="cursor-pointer block">
                  {postureImages.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {postureImages.map((file, i) => (
                          <div key={i} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`pose ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                            />
                            <span className="absolute top-1 left-1 bg-gray-950/80 text-xs text-gray-300 rounded px-1">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{postureImages.length} image{postureImages.length !== 1 ? 's' : ''} selected · click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 mx-auto text-gray-600" />
                      <p className="text-sm font-medium text-gray-400">Click to select push-up photos</p>
                      <p className="text-xs text-gray-600">PNG, JPG — select 3 or more images</p>
                    </div>
                  )}
                </label>
              </div>

              {postureError && (
                <div className="flex items-center gap-2 mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {postureError}
                </div>
              )}

              {postureImages.length >= 3 && !postureUploading && !postureAnalyzing && (
                <button
                  onClick={handlePostureAnalyze}
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700 py-2.5 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Analyze My Form
                </button>
              )}

              {(postureUploading || postureAnalyzing) && (
                <div className="mt-4 text-center py-6">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-3"></div>
                  <p className="text-sm font-medium text-white">
                    {postureUploading ? 'Uploading images...' : 'Analyzing your form...'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">Our AI is checking your posture and technique</p>
                </div>
              )}
            </div>

            {/* Results */}
            {postureAnalysis && !postureAnalyzing && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-fade-in">
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Form Score</p>
                    <div className="text-5xl font-bold text-violet-400">
                      {postureAnalysis.score ?? postureAnalysis.overall_score ?? '—'}
                      <span className="text-2xl text-gray-600">/100</span>
                    </div>
                  </div>

                  {(postureAnalysis.feedback || postureAnalysis.analysis || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">Detailed Feedback</p>
                      {(postureAnalysis.feedback || postureAnalysis.analysis).map((item, idx) => {
                        const isGood = item.status === 'good' || item.rating === 'good' || item.score >= 70;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-start gap-3 ${
                              isGood ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
                            }`}
                          >
                            {isGood ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">{item.aspect || item.category || item.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.message || item.feedback || item.comment}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {postureAnalysis.summary && (
                    <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">AI Summary</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{postureAnalysis.summary}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setPostureImages([]); setPostureAnalysis(null); setPostureError(''); }}
                    className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
                  >
                    Analyze Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calories Tab */}
        {activeTab === 'calories' && (
          <div className="space-y-4 animate-fade-in">
            <TabBanner tab="calories" />
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-400" />
                AI Calorie Analyzer
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                Upload a photo of your meal — Gemini Vision will identify the food and estimate calories
              </p>

              <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-gray-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="imageUpload"
                />
                <label htmlFor="imageUpload" className="cursor-pointer block">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img src={imagePreview} alt="Meal preview" className="max-h-56 mx-auto rounded-lg" />
                      <p className="text-xs text-gray-600">Click to upload a different photo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-10 h-10 mx-auto text-gray-600" />
                      <p className="text-sm font-medium text-gray-400">Click to upload meal photo</p>
                      <p className="text-xs text-gray-600">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Loading state */}
              {analyzing && (
                <div className="mt-4 flex items-center justify-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Analyzing your meal with AI...</span>
                </div>
              )}

              {/* Error */}
              {calorieError && (
                <div className="flex items-center gap-2 mt-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {calorieError}
                </div>
              )}

              {/* Real result from API */}
              {calorieResult && !analyzing && (
                <div className="mt-4 bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-4 animate-fade-in">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Detected Food</p>
                    <p className="text-white font-semibold text-base">
                      {calorieResult.food_name || calorieResult.food || calorieResult.detected_food || 'Unknown food'}
                    </p>
                    {calorieResult.description && (
                      <p className="text-xs text-gray-500 mt-1">{calorieResult.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Calories', value: calorieResult.calories ?? calorieResult.total_calories, unit: 'kcal', color: 'text-orange-400' },
                      { label: 'Protein', value: calorieResult.protein ?? calorieResult.protein_g, unit: 'g', color: 'text-blue-400' },
                      { label: 'Carbs', value: calorieResult.carbs ?? calorieResult.carbohydrates ?? calorieResult.carbs_g, unit: 'g', color: 'text-violet-400' },
                      { label: 'Fat', value: calorieResult.fat ?? calorieResult.fats ?? calorieResult.fat_g, unit: 'g', color: 'text-yellow-400' },
                    ].map(({ label, value, unit, color }) => value != null && (
                      <div key={label} className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-500">{unit}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {calorieResult.notes && (
                    <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-3">
                      {calorieResult.notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveToLog}
                      disabled={savingToLog || savedToLog}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        savedToLog
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {savingToLog
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        : savedToLog
                        ? <>✓ Saved to Food Log</>
                        : <>Save to Food Log</>
                      }
                    </button>
                    <button
                      onClick={() => { setImagePreview(null); setCalorieResult(null); setCalorieError(''); setSavedToLog(false); }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
                    >
                      New Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
