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

/* ── daily nutrition targets ── */
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fats: 9 };

const MacroStat = ({ label, grams, percent, icon: Icon, text, delay }) => {
  const [show, setShow] = useState(false);
  const count = useCounter(grams, show);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className={`bg-gray-950/40 border border-gray-800 rounded-xl p-3 sm:p-4 transition-all duration-700
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${text}`} />
        <p className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-medium truncate">{label}</p>
      </div>
      <p className="flex items-baseline gap-1">
        <span className={`text-xl sm:text-2xl font-bold tabular-nums ${text}`}>{count}</span>
        <span className="text-xs text-gray-500">g</span>
      </p>
      <p className="text-[10px] text-gray-600 mt-0.5 tabular-nums">{Math.round(percent)}% of kcal</p>
    </div>
  );
};

const NutritionTargets = ({ calories, macros }) => {
  const [show, setShow] = useState(false);
  const count = useCounter(calories, show);
  useEffect(() => { const t = setTimeout(() => setShow(true), 50); return () => clearTimeout(t); }, []);

  const macroKcal = macros.reduce((sum, m) => sum + m.kcal, 0);
  const share = (m) => (macroKcal ? (m.kcal / macroKcal) * 100 : 0);

  return (
    <div className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-400" />
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Daily Nutrition Targets</p>
      </div>

      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.07] via-transparent to-violet-500/[0.07] pointer-events-none" />

        <div className="relative flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-1">Calorie target</p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                {calories == null ? '—' : count}
              </span>
              <span className="text-sm text-gray-500 font-medium">kcal / day</span>
            </p>
          </div>
          {macroKcal > 0 && (
            <p className="text-[11px] text-gray-500 tabular-nums">
              {macros.map((m) => `${Math.round(share(m))}% ${m.short}`).join(' · ')}
            </p>
          )}
        </div>

        {macroKcal > 0 && (
          <div className="relative mt-4 flex h-2 rounded-full overflow-hidden bg-gray-800">
            {macros.map((m) => (
              <div
                key={m.key}
                className={`${m.bar} transition-[width] duration-1000 ease-out`}
                style={{ width: show ? `${share(m)}%` : '0%' }}
              />
            ))}
          </div>
        )}

        {macros.length > 0 && (
          <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            {macros.map((m, i) => (
              <MacroStat key={m.key} {...m} percent={share(m)} delay={150 + i * 100} />
            ))}
          </div>
        )}
      </div>
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

  const calories = Number.isFinite(Number(plan.daily_calories)) ? Number(plan.daily_calories) : null;

  const macroList = [
    { key: 'protein', label: 'Protein', short: 'P', grams: protein, icon: Beef,     bar: 'bg-red-500',   text: 'text-red-400'   },
    { key: 'carbs',   label: 'Carbs',   short: 'C', grams: carbs,   icon: Wheat,    bar: 'bg-amber-500', text: 'text-amber-400' },
    { key: 'fats',    label: 'Fats',    short: 'F', grams: fats,    icon: Droplets, bar: 'bg-blue-500',  text: 'text-blue-400'  },
  ]
    .map(m => ({ ...m, grams: Number(m.grams) }))
    .filter(m => Number.isFinite(m.grams))
    .map(m => ({ ...m, kcal: m.grams * KCAL_PER_GRAM[m.key] }));

  return (
    <div className="space-y-8">

      {/* ── Macro targets ── */}
      {(calories != null || macroList.length > 0) && (
        <NutritionTargets calories={calories} macros={macroList} />
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
