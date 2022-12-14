# PlayOnTip

A simple python app to play several songs using your fingertips.
Connect your finger tips to the tip of your thumb. Release to stop the song.

## Requirements
- `mediapipe==0.9.0`
- `opencv-python==4.2.0.34`
- `numpy==1.22.4`
- `sounddevice==0.4.5`
- `soundfile==0.11.0`

## Installation
Create a conda environment and use `pip` package manager to install the required packages.

## How to run
1. Activate your conda environment that is used in this project.

2. Move to the directory where `hands_mediapipe.py` is located

3. Run the following command
    ```bash
      python hands_mediapipe.py
    ```

4. Have fun with the hand detection and playing the songs by connecting
   and releasing tipping of your fingers and your thumb tip.

5. Press `Esc` to close the program.


You can provide any `.wav` files for the song that you want to play in `sound-resources` 
directory.

## To do
- [ ] Improve robustness of the fingertip detection
- [ ] C++ implementation for GPU utilization
- [ ] More interactive GUI and HUD display


## Credits
- [Noizz](https://www.noiiz.com/) (a huge library of royalty free loops and samples)
