/**
 * jspsych-serial-reaction-time
 * Josh de Leeuw
 *
 * plugin for running a serial reaction time task
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["serial-reaction-time-keys-moving"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'serial-reaction-time-keys-moving',
    description: '',
    parameters: {
      target: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Target',
        array: true,
        default: undefined,
        description: 'The location of the target. The array should be the [row, column] of the target.'
      },
      trail: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: null
      },
      grid: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Grid',
        array: true,
        default: [[1,1,1,1]],
        description: 'This array represents the grid of boxes shown on the screen.'
      },
      correct_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Correct Key',
        default: undefined
      },
      grid_square_size: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Grid square size',
        default: 100,
        description: 'The width and height in pixels of each square in the grid.'
      },
      target_color: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target color',
        default: "#999",
        description: 'The color of the target square.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, the trial ends after a key press.'
      },
      pre_target_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Pre-target duration',
        default: 0,
        description: 'The number of milliseconds to display the grid before the target changes color.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: -1,
        description: 'How long to show the trial'
      },
      fade_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Fade duration',
        default: -1,
        description: 'If a positive number, the target will progressively change color at the start of the trial, with the transition lasting this many milliseconds.'
      },
      allow_nontarget_responses: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Allow nontarget response',
        default: false,
        description: 'If true, then user can make nontarget response.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: '',
        description: 'Any content here will be displayed below the stimulus'
      },
    }
  }

  plugin.trial = function(display_element, trial) {

    var startTime = -1;
    var response = {
      rt: -1,
      row: -1,
      column: -1
    }

    // display stimulus
    var stimulus = this.stimulus(trial.grid, trial.grid_square_size);
    display_element.innerHTML = stimulus;

    if(trial.trail !== null){
      for(var i=0; i<trial.trail.length; i++){
        display_element.querySelector('#jspsych-serial-reaction-time-stimulus-cell-'+trial.trail[i][0]+'-'+trial.trail[i][1]).style.backgroundColor = trial.target_color;
        display_element.querySelector('#jspsych-serial-reaction-time-stimulus-cell-'+trial.trail[i][0]+'-'+trial.trail[i][1]).style.opacity = 0.5;
      }
    }

		if(trial.pre_target_duration <= 0){
			showTarget();
		} else {
			jsPsych.pluginAPI.setTimeout(function(){
				showTarget();
			}, trial.pre_target_duration);
		}

		//show prompt if there is one
    if (trial.prompt !== "") {
      display_element.insertAdjacentHTML('beforeend', trial.prompt);
    }

		function showTarget(){

      startTime = Date.now();

      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.correct_key],
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });

      if(trial.fade_duration == -1){
        display_element.querySelector('#jspsych-serial-reaction-time-stimulus-cell-'+trial.target[0]+'-'+trial.target[1]).style.backgroundColor = trial.target_color;
      } else {
        display_element.querySelector('#jspsych-serial-reaction-time-stimulus-cell-'+trial.target[0]+'-'+trial.target[1]).style.transition = "background-color "+trial.fade_duration;
        display_element.querySelector('#jspsych-serial-reaction-time-stimulus-cell-'+trial.target[0]+'-'+trial.target[1]).style.backgroundColor = trial.target_color;
      }

			if(trial.trial_duration > -1){
				jsPsych.pluginAPI.setTimeout(endTrial, trial.trial_duration);
			}

		}

    function endTrial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
				"grid": JSON.stringify(trial.grid),
				"target": JSON.stringify(trial.target),
        "correct": response.row == trial.target[0] && response.column == trial.target[1]
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);

    };

    // function to handle responses by the subject
    function after_response(info) {

			// only record first response
      response = response.rt == -1 ? info : response;

      if (trial.response_ends_trial) {
        // animate movement, if any
        var start = null;
        var stim = display_element.querySelector('#jspsych-serial-reaction-time-stimulus');
        var start_left = -67.5;
        var start_top = -67.5;
        var end_left = -67.5;
        var end_top = -67.5;
        if(trial.target[1] == 1){
          end_left = 0;
        }
        if(trial.target[1] == 3){
          end_left = -67.5*2;
        }
        if(trial.target[0] == 1){
          end_top = 0;
        }
        if(trial.target[0] == 3){
          end_top = -67.5*2;
        }
        function step_animation(t){
          if(!start) { start = t; }
          var prog = Math.min((t - start) / 300, 1); // 300 ms
          stim.style.left = ((1-prog)*start_left) + prog*end_left + "px";
          stim.style.top = ((1-prog)*start_top) + prog*end_top + "px";
          if(prog < 1){
            window.requestAnimationFrame(step_animation)
          } else {
            endTrial();
          }
        }
        window.requestAnimationFrame(step_animation);

      }
    };

  };

  plugin.stimulus = function(grid, square_size, target, target_color, labels) {
    var stimulus = "<div id='jspsych-serial-reaction-time-stimulus-container' style='border: 2px solid black; overflow: hidden; position: relative; width:"+(square_size*grid.length*1.345)+"px; height:"+(square_size*grid.length*1.345)+"px;'>"
    stimulus += "<div id='jspsych-serial-reaction-time-stimulus' style='position: absolute; top:"+square_size*-1.35+"px; left:"+square_size*-1.35+"px; width:"+(square_size*(grid.length+2)*1.35)+"px; height:"+(square_size*(grid.length+2)*1.35)+"px;margin:auto; display: table; table-layout: fixed; border-spacing:"+square_size/4+"px'>";
    for(var i=-1; i<=grid.length; i++){
      stimulus += "<div class='jspsych-serial-reaction-time-stimulus-row' style='display:table-row;'>";
      for(var j=-1; j<=grid[0].length; j++){
        var classname = 'jspsych-serial-reaction-time-stimulus-cell';

        stimulus += "<div class='"+classname+"' id='jspsych-serial-reaction-time-stimulus-cell-"+i+"-"+j+"' "+
          "data-row="+i+" data-column="+j+" "+
          "style='width:"+square_size+"px; height:"+square_size+"px; display:table-cell; vertical-align:middle; text-align: center; cursor: pointer; font-size:"+square_size/2+"px;";

        stimulus += "border: 2px solid black;"

        if(typeof target !== 'undefined' && target[0] == i && target[1] == j){
          stimulus += "background-color: "+target_color+";"
        }
        stimulus += "'>";
        if(typeof labels !=='undefined' && labels[i][j] !== false){
          stimulus += labels[i][j]
        }
        stimulus += "</div>";
      }
      stimulus += "</div>";
    }
    stimulus += "</div>";
    stimulus += "</div>";

    return stimulus
  }

  return plugin;
})();
