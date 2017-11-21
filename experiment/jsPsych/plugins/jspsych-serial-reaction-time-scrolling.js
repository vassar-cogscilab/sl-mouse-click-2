/**
 * jspsych-serial-reaction-time
 * Josh de Leeuw
 *
 * plugin for running a serial reaction time task
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["serial-reaction-time-scrolling"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'serial-reaction-time-scrolling',
    description: '',
    parameters: {
      target: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      target_color: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '#000'
      },
      num_options: {
        type: jsPsych.plugins.parameterType.INT,
        default: 4
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        default: ['s','f','h','k']
      },
      history: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: []
      },
      history_color: {
        type: jsPsych.plugins.parameterType.STRING,
        array: true,
        default: []
      },
      history_length: {
        type: jsPsych.plugins.parameterType.INT,
        default: 3
      },
      square_size: {
        type: jsPsych.plugins.parameterType.INT,
        default: 75
      },
      gap_size: {
        type: jsPsych.plugins.parameterType.INT,
        default: 15
      },
      duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: 1000
      },
      pitch_frequency: {
        type: jsPsych.plugins.parameterType.INT,
        default: null
      },
      pitch_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: 500
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    // trial.history_length
    // trial.num_options
    // trial.square_size
    // trial.gap_size

    var stimulus = "<div id='jspsych-serial-reaction-time-stimulus-container' style='overflow: hidden; position: relative; width:"+(trial.square_size * trial.num_options + trial.gap_size * 2 * trial.num_options)+"px; height:"+(2*trial.square_size*(trial.history_length+1))+"px;'>";

    // add boxes for different response options
    for(var i=0; i<trial.num_options; i++){
      stimulus += "<div id='keybox-"+i+"' style='position:absolute; background-color:#dedede; width:"+trial.square_size+"px; height:"+trial.square_size+"px; bottom: 0px; left:"+(trial.gap_size + i*(trial.square_size+trial.gap_size*2))+"px;'></div>";
    }

    // add container for animating elements
    stimulus += "<div id='jspsych-serial-reaction-time-scroller' style='position:absolute; bottom: "+(-trial.square_size)+"px; width: 100%; height: 100%;'>"

    // show target
    stimulus += "<div id='jspsych-serial-reaction-time-target' style='position:absolute; background-color:"+trial.target_color+"; width:"+trial.square_size+"px; height:"+trial.square_size+"px; bottom: 0px; left:"+(trial.gap_size + trial.target*(trial.square_size+trial.gap_size*2))+"px; border-radius:"+trial.square_size/2+"px;'></div>";

    // show history
    for(var i=0; i<trial.history.length; i++){
      if(trial.history_color.length > i){
        var hist_color = trial.history_color[i];
      } else {
        var hist_color = trial.target_color;
      }
      stimulus += "<div class='jspsych-serial-reaction-time-history' style='position:absolute; background-color:"+hist_color+"; width:"+trial.square_size+"px; height:"+trial.square_size+"px; bottom: "+(2*trial.square_size*(i+1))+"px; left:"+(trial.gap_size + trial.history[i]*(trial.square_size+trial.gap_size*2))+"px; border-radius:"+trial.square_size/2+"px;'></div>";
    }

    stimulus += "</div></div>";

    display_element.innerHTML = stimulus;

    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'date',
      persist: false,
      allow_held_key: false
    });

    // play sound
    if(trial.pitch_frequency !== null){
      var audioCtx = jsPsych.pluginAPI.audioContext();
      if(audioCtx !== null){
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = trial.pitch_frequency;
        g.connect(audioCtx.destination);
        o.connect(g);
        o.start(0);
        g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1.5);
      }
    }

    // scroll items
    var stim = display_element.querySelector('#jspsych-serial-reaction-time-scroller');
    var start = null;
    function step_animation(t){
      if(!start) { start = t; }
      var prog = Math.min((t - start) / trial.duration, 1);
      stim.style.bottom = ((1-prog)*(-trial.square_size)) + prog*trial.square_size + "px";
      if(prog < 1){
        window.requestAnimationFrame(step_animation)
      } else {
        endTrial();
      }
    }
    window.requestAnimationFrame(step_animation);

    // function to handle responses by the subject
    function after_response(info) {
      var choices_lc = trial.choices.map(function(x) { return x.toLowerCase(); });
      var which_response = choices_lc.indexOf(jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(info.key).toLowerCase());
      var correct = trial.target == which_response;
      display_element.querySelector('#keybox-'+which_response).style.backgroundColor = correct ? '#0f0' : '#000';
    };

    function endTrial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // gather the data to store for the trial
      var trial_data = {

      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);

    };



  };

  return plugin;
})();
