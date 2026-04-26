import { useState, useEffect } from 'react';
import {
  Flame, Beef, Wheat, Droplets, Dumbbell, Activity,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Star, Shield,
} from 'lucide-react';

/* ── animated count-up ── */
const useCounter = (target, active) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    let start = null;
    const duration = 900;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val;
};

/* ── macro card ── */
const MacroCard = ({ icon: Icon, label, value, unit, gradient, textColor, delay }) => {
  const [show, setShow] = useState(false);
  const count = useCounter(value, show);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className={`relative bg-gray-900 border border-gray-800 rounded-2xl p-5 overflow-hidden
      transition-all duration-700 hover:border-gray-700 hover:shadow-lg hover:shadow-black/30
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 pointer-events-none`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center mb-3 shadow-inner`}>
        <Icon className={`w-5 h-5 ${textColor}`} />
      </div>
      <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1 font-medium">{label}</p>
      <p className={`text-3xl font-extrabold ${textColor}`}>
        {count}
        <span className="text-sm text-gray-500 font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
};

/* ── single workout day (accordion) ── */
const DayCard = ({ day, index }) => {
  const [open, setOpen] = useState(index === 0);
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), index * 70); return () => clearTimeout(t); }, [index]);

  const exercises = day.routine ?? day.exercises ?? [];
  const restDay = exercises.length === 0 || (typeof exercises[0] === 'string' && exercises[0].toLowerCase().includes('rest'));

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-500
      ${open ? 'border-violet-500/30' : 'border-gray-800'}
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      <button
        onClick={() => !restDay && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3.5
          ${open ? 'bg-gray-900' : 'bg-gray-900/60 hover:bg-gray-900'} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
            ${restDay ? 'bg-gray-800 text-gray-500' : 'bg-violet-500/20 text-violet-400'}`}>
            {index + 1}
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">{day.day}</p>
            {day.focus && <p className={`text-xs mt-0.5 ${restDay ? 'text-gray-600' : 'text-violet-400'}`}>{day.focus}</p>}
          </div>
        </div>
        {!restDay && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 hidden sm:block">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
            {open
              ? <ChevronUp className="w-4 h-4 text-gray-500" />
              : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        )}
      </button>

      {open && !restDay && (
        <div className="bg-gray-950 border-t border-gray-800/60 px-4 py-4 space-y-2.5">
          {exercises.map((ex, i) => {
            const label = typeof ex === 'string'
              ? ex
              : [ex.name, ex.sets && `${ex.sets} sets`, ex.reps && `× ${ex.reps}`, ex.rest && `· Rest ${ex.rest}`]
                  .filter(Boolean).join(' ');
            return (
              <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                <span>{label}</span>
              </div>
            );
          })}
          {day.notes && (
            <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-start gap-2 text-xs text-gray-500 italic">
              <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              {day.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── section wrapper ── */
const Section = ({ icon: Icon, iconColor, title, children, delay = 0 }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{title}</p>
      </div>
      {children}
    </div>
  );
};

/* ══════════════════════════════════════════
   Main AIPlanCard
══════════════════════════════════════════ */
const AIPlanCard = ({ plan }) => {
  if (!plan) return null;

  /* normalise macros — GET view returns flat, POST response nests under plan.macros */
  const macros = plan.macros ?? {};
  const protein = plan.protein_grams ?? macros.protein_grams;
  const carbs   = plan.carbohydrates_grams ?? macros.carbohydrates_grams;
  const fats     = plan.fats_grams ?? macros.fats_grams;

  const weeklyPlan   = plan.weekly_workout_plan ?? [];
  const cardioPlan   = plan.cardio_plan;
  const foodsToEat   = plan.foods_to_eat ?? [];
  const foodsToAvoid = plan.foods_to_avoid ?? [];
  const safetyNotes  = plan.safety_notes ?? [];

  const macroCards = [
    { icon: Flame,    label: 'Daily Calories',  value: plan.daily_calories, unit: 'kcal', gradient: 'from-orange-500 to-red-500',   textColor: 'text-orange-400', delay: 0   },
    { icon: Beef,     label: 'Protein',          value: protein,             unit: 'g',    gradient: 'from-red-500 to-pink-500',     textColor: 'text-red-400',    delay: 100 },
    { icon: Wheat,    label: 'Carbohydrates',    value: carbs,               unit: 'g',    gradient: 'from-amber-500 to-yellow-500', textColor: 'text-amber-400',  delay: 200 },
    { icon: Droplets, label: 'Fats',             value: fats,                unit: 'g',    gradient: 'from-blue-500 to-cyan-500',    textColor: 'text-blue-400',   delay: 300 },
  ].filter(m => m.value != null);

  return (
    <div className="space-y-8">

      {/* ── Macro targets ── */}
      {macroCards.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">Daily Nutrition Targets</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {macroCards.map(m => <MacroCard key={m.label} {...m} />)}
          </div>
        </div>
      )}

      {/* ── Weekly Workout Plan ── */}
      {weeklyPlan.length > 0 && (
        <Section icon={Dumbbell} iconColor="text-violet-400" title="Weekly Workout Plan" delay={200}>
          <div className="space-y-2">
            {weeklyPlan.map((day, i) => (
              <DayCard key={i} day={day} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Cardio Plan ── */}
      {cardioPlan && (
        <Section icon={Activity} iconColor="text-green-400" title="Cardio Plan" delay={300}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {typeof cardioPlan === 'string' ? (
              <p className="text-gray-300 text-sm leading-relaxed">{cardioPlan}</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(cardioPlan).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-500 capitalize min-w-[7rem] flex-shrink-0">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-200">
                      {typeof v === 'object' ? Object.entries(v).map(([dk, dv]) => `${dk}: ${dv}`).join(', ') : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Diet ── */}
      {(foodsToEat.length > 0 || foodsToAvoid.length > 0) && (
        <Section icon={CheckCircle} iconColor="text-emerald-400" title="Diet Recommendations" delay={400}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {foodsToEat.length > 0 && (
              <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-400">Eat More Of</p>
                </div>
                <ul className="space-y-2">
                  {foodsToEat.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {typeof f === 'string' ? f : f.name ?? JSON.stringify(f)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {foodsToAvoid.length > 0 && (
              <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Avoid These</p>
                </div>
                <ul className="space-y-2">
                  {foodsToAvoid.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {typeof f === 'string' ? f : f.name ?? JSON.stringify(f)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </Section>
      )}

      {/* ── Safety Notes ── */}
      {safetyNotes.length > 0 && (
        <Section icon={Shield} iconColor="text-amber-400" title="Safety Notes" delay={500}>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-2">
            {safetyNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-amber-200/80">
                <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                {typeof note === 'string' ? note : JSON.stringify(note)}
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
};

export default AIPlanCard;
