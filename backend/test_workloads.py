import time
import psutil
import numpy as np
from multiprocessing import cpu_count
import threading
import winsound  # For playing sounds on Windows

# Musical notes mapping to CPU levels (7 notes, ~14% each)
NOTES = {
    'C': (0, 15),      # 0-15% - Very Light
    'D': (15, 30),     # 15-30% - Light
    'E': (30, 45),     # 30-45% - Light-Medium
    'F': (45, 60),     # 45-60% - Medium
    'G': (60, 75),     # 60-75% - Medium-Heavy
    'A': (75, 90),     # 75-90% - Heavy
    'B': (90, 100),    # 90-100% - Very Heavy
}

# Musical note frequencies (in Hz) - C4 major scale
NOTE_FREQUENCIES = {
    'C': 262,  # C4
    'D': 294,  # D4
    'E': 330,  # E4
    'F': 349,  # F4
    'G': 392,  # G4
    'A': 440,  # A4
    'B': 494,  # B4
}

# ============ WORKLOAD FUNCTIONS ============

def bubble_sort_light():
    """C note (~10% CPU) - Light load with sleep."""
    # Small matrix ops with sleep - keep this one good
    a = np.random.rand(400, 400)
    b = np.random.rand(400, 400)
    _ = np.dot(a, b)
    time.sleep(0.05)

def fractal_light():
    """D note (~25% CPU) - Medium computation."""
    # Slightly larger matrix, less sleep for higher CPU
    a = np.random.rand(550, 550)
    b = np.random.rand(550, 550)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)
    time.sleep(0.008)

def binary_tree_medium():
    """E note (~40% CPU) - Heavier computation."""
    # Smaller matrix, more sleep to lower it
    a = np.random.rand(500, 500)
    b = np.random.rand(500, 500)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)
    time.sleep(0.008)

def maze_generation_medium():
    """F note (~55% CPU) - Heavy computation."""
    # Smaller size to lower by ~10%
    a = np.random.rand(620, 620)
    b = np.random.rand(620, 620)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)
    result = np.sqrt(np.abs(result))
    time.sleep(0.004)

def particle_collision_heavy():
    """G note (~70% CPU) - Very heavy computation."""
    # Significantly larger for better separation
    a = np.random.rand(850, 850)
    b = np.random.rand(850, 850)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)
    c = np.random.rand(850, 850)
    result = np.dot(result, c)
    time.sleep(0.001)

def matrix_multiply_very_heavy():
    """A note (~85% CPU) - Extreme computation."""
    # Much larger to push higher
    a = np.random.rand(1300, 1300)
    b = np.random.rand(1300, 1300)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)
    c = np.random.rand(1300, 1300)
    result = np.dot(result, c)

def sudoku_solver_extreme():
    """B note (~100% CPU) - MAXIMUM computation."""
    # MASSIVELY larger to push to 90%+
    a = np.random.rand(1700, 1700)
    b = np.random.rand(1700, 1700)
    result = np.dot(a, b)
    result = np.sin(result) * np.cos(result)

    c = np.random.rand(1700, 1700)
    result2 = np.dot(c, result)
    result2 = np.sqrt(np.abs(result2))

    # Additional computation to really max it out
    d = np.random.rand(1700, 1700)
    result3 = np.dot(result2[:1500, :1500], d[:1500, :1500])

# ============ WORKER THREADS ============

def worker_thread(end_time, work_func):
    """Worker thread that runs work_func until end_time."""
    while time.time() < end_time:
        work_func()

def play_note_sound(note, duration_ms=500):
    """Play a musical note using the system speaker."""
    frequency = NOTE_FREQUENCIES.get(note, 440)
    winsound.Beep(frequency, duration_ms)

def run_note_workload(note, num_threads, duration=4, play_sound=False):
    """Run a workload targeting a specific note."""
    workload_map = {
        'C': bubble_sort_light,
        'D': fractal_light,
        'E': binary_tree_medium,
        'F': maze_generation_medium,
        'G': particle_collision_heavy,
        'A': matrix_multiply_very_heavy,
        'B': sudoku_solver_extreme,
    }

    work_func = workload_map[note]
    print(f"\n[NOTE {note}] Running on {num_threads} threads for {duration}s...")

    # Play sound at the start if requested
    if play_sound:
        play_note_sound(note, duration_ms=500)

    end_time = time.time() + duration
    threads = []

    for _ in range(num_threads):
        t = threading.Thread(target=worker_thread, args=(end_time, work_func))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    print(f"  Completed {note}")
    time.sleep(0.2)

def play_twinkle_twinkle():
    """Play Twinkle Twinkle Little Star with CPU workloads and sound."""
    print("="*60)
    print("TWINKLE TWINKLE LITTLE STAR - CPU MUSICAL PERFORMANCE")
    print("="*60)
    print(f"System has {cpu_count()} CPU cores")
    print("Watch cpu_monitor.py and listen to the speakers!")
    print("="*60)

    # Twinkle Twinkle Little Star note sequence
    # C C G G A A G - F F E E D D C
    # Twinkle twinkle little star, how I wonder what you are
    song = [
        'C', 'C', 'G', 'G', 'A', 'A', 'G',  # Twinkle twinkle little star
        'F', 'F', 'E', 'E', 'D', 'D', 'C',  # How I wonder what you are
    ]

    cores = cpu_count()

    # Thread mapping for each note
    thread_map = {
        'C': 1,
        'D': 2,
        'E': max(3, cores // 3),
        'F': max(4, cores // 2),
        'G': max(5, (cores * 2) // 3),
        'A': max(6, (cores * 3) // 4),
        'B': cores,
    }

    time.sleep(2)

    for i, note in enumerate(song, 1):
        print(f"\n[{i}/{len(song)}] Playing note: {note}")
        num_threads = thread_map[note]
        run_note_workload(note, num_threads, duration=0.5, play_sound=True)
        # 1 second delay already in run_note_workload

    print("\n" + "="*60)
    print("SONG COMPLETE!")
    print("="*60)

def run_all_notes():
    """Run all 7 notes sequentially."""
    print("="*60)
    print("MUSICAL CPU WORKLOAD TEST - 7 NOTES (C to B)")
    print("="*60)
    print(f"System has {cpu_count()} CPU cores")
    print("Starting workload tests...")
    print("(Watch cpu_monitor.py to see notes being played)")
    print("="*60)

    time.sleep(2)

    # Calculate threads for each note
    cores = cpu_count()

    # Run each note twice with carefully tuned threading (4 seconds each)
    for cycle in range(2):
        print(f"\n--- CYCLE {cycle+1} ---")

        # C: ~10% CPU - 1 thread
        run_note_workload('C', 1, 4)

        # D: ~25% CPU - 2 threads
        run_note_workload('D', 2, 4)

        # E: ~40% CPU - 3-4 threads
        run_note_workload('E', max(3, cores // 3), 4)

        # F: ~55% CPU - 4-5 threads
        run_note_workload('F', max(4, cores // 2), 4)

        # G: ~70% CPU - 5-6 threads
        run_note_workload('G', max(5, (cores * 2) // 3), 4)

        # A: ~85% CPU - 6-7 threads
        run_note_workload('A', max(6, (cores * 3) // 4), 4)

        # B: ~100% CPU - all cores
        run_note_workload('B', cores, 4)

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    # Choose which function to run:
    # run_all_notes()  # Run all notes in sequence (test mode)
    play_twinkle_twinkle()  # Play Twinkle Twinkle Little Star
