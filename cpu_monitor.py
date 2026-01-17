import psutil
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque

# Musical notes mapping (7 notes)
NOTES = {
    'C': (0, 15),      # 0-15%
    'D': (15, 30),     # 15-30%
    'E': (30, 45),     # 30-45%
    'F': (45, 60),     # 45-60%
    'G': (60, 75),     # 60-75%
    'A': (75, 90),     # 75-90%
    'B': (90, 100),    # 90-100%
}

# Balanced smoothing for stable note detection
SMOOTHING_WINDOW = 20  # Balanced for responsiveness and stability
cpu_history = deque(maxlen=SMOOTHING_WINDOW)
current_note = 'C'
last_note = 'C'

def get_current_note(cpu_percent):
    """Map CPU percentage to musical note with smoothing."""
    global current_note, last_note

    # Add to history
    cpu_history.append(cpu_percent)

    # Calculate average - but reset on significant CPU changes (new note starting)
    # If CPU jumps significantly (>10%) or drops to near zero, we're transitioning
    if len(cpu_history) >= 3:
        recent_avg = sum(list(cpu_history)[-3:]) / 3

        # If we detect a transition (very low CPU or big jump), clear old data
        if recent_avg < 8:  # Transition period (sleep between notes)
            # Keep only recent values
            while len(cpu_history) > 3:
                cpu_history.popleft()

    # Calculate average of history
    avg_cpu = sum(cpu_history) / len(cpu_history) if cpu_history else cpu_percent

    # Find note that average CPU falls into
    detected_note = current_note
    for note, (min_cpu, max_cpu) in NOTES.items():
        if min_cpu <= avg_cpu < max_cpu:
            detected_note = note
            break

    # If note changed, clear history to start fresh
    if detected_note != last_note:
        cpu_history.clear()
        cpu_history.append(cpu_percent)
        last_note = detected_note

    current_note = detected_note
    return current_note

# Set up the figure with modern layout
fig = plt.figure(figsize=(16, 8))
fig.patch.set_facecolor('#0a0a0a')

# Create single subplot for CPU graph
ax1 = plt.subplot(111)
ax1.set_position([0.08, 0.12, 0.86, 0.78])  # [left, bottom, width, height]

# Data storage for plotting
cpu_data = deque(maxlen=200)  # More history for smoother graph

def update_graph(frame):
    global current_note

    # Get current CPU usage
    cpu_usage = psutil.cpu_percent(interval=0.1)
    cpu_data.append(cpu_usage)

    # Get current note (with smoothing)
    note = get_current_note(cpu_usage)

    # Modern color scheme
    note_colors = {
        'C': '#00D9FF',  # Cyan
        'D': '#00FF88',  # Mint
        'E': '#FFE600',  # Yellow
        'F': '#FF8C00',  # Orange
        'G': '#FF3366',  # Pink
        'A': '#CC00FF',  # Purple
        'B': '#FF0066',  # Hot Pink
    }

    # Clear and style the plot
    ax1.clear()
    ax1.set_facecolor('#0f0f0f')

    # Plot CPU usage line
    x_data = list(range(len(cpu_data)))
    y_data = list(cpu_data)

    # Apply visual smoothing using moving average
    if len(y_data) > 5:
        smoothed_y = []
        window = 5
        for i in range(len(y_data)):
            start = max(0, i - window // 2)
            end = min(len(y_data), i + window // 2 + 1)
            smoothed_y.append(sum(y_data[start:end]) / (end - start))
        y_data = smoothed_y

    # Smooth gradient fill
    ax1.fill_between(x_data, y_data, 0, alpha=0.25, color=note_colors[current_note])

    # Main line - thicker and smoother
    ax1.plot(x_data, y_data, color=note_colors[current_note], linewidth=4,
             alpha=0.95, solid_capstyle='round')

    # Clean grid
    ax1.grid(True, alpha=0.1, color='white', linestyle='-', linewidth=0.5)

    # Note boundary lines - minimal and clean
    for boundary in [15, 30, 45, 60, 75, 90]:
        ax1.axhline(y=boundary, color='#333333', linestyle='-', alpha=0.3, linewidth=1)

    # Styling
    ax1.set_ylim(0, 100)
    ax1.set_xlim(0, max(200, len(cpu_data)))
    ax1.set_ylabel('CPU %', color='#888888', fontsize=14)
    ax1.set_xlabel('')
    ax1.tick_params(colors='#555555', labelsize=11)

    # Clean spines
    for spine in ['top', 'right']:
        ax1.spines[spine].set_visible(False)
    for spine in ['bottom', 'left']:
        ax1.spines[spine].set_edgecolor('#333333')
        ax1.spines[spine].set_linewidth(1)

    # Calculate average CPU
    avg_cpu = sum(cpu_history) / len(cpu_history) if cpu_history else 0

    # LARGE NOTE DISPLAY - top left
    ax1.text(0.05, 0.92, current_note, transform=ax1.transAxes,
             fontsize=180, ha='left', va='top', color=note_colors[current_note],
             fontweight='bold', alpha=0.85, family='monospace')

    # Stats - clean and minimal top right
    ax1.text(0.98, 0.96, f'{cpu_usage:.1f}%', transform=ax1.transAxes,
             fontsize=48, ha='right', va='top', color=note_colors[current_note],
             fontweight='bold', alpha=0.9, family='monospace')

    ax1.text(0.98, 0.88, f'avg {avg_cpu:.1f}%', transform=ax1.transAxes,
             fontsize=16, ha='right', va='top', color='#666666',
             fontweight='normal', family='monospace')

# Create animation that updates every 200ms
ani = animation.FuncAnimation(fig, update_graph, interval=200, cache_frame_data=False)
plt.tight_layout()
plt.show()
