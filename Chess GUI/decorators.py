import time


def timing_decorator(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        elapsed_time = end_time - start_time
        minutes, seconds = divmod(int(elapsed_time), 60)
        milliseconds = int((elapsed_time - int(elapsed_time)) * 1000)
        print(f"Function '{func.__name__}' executed in {minutes} minutes, {seconds} seconds, and {milliseconds} milliseconds")
        return result
    return wrapper