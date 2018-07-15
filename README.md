# MMM-Wunderlist
This an extension for the [MagicMirror](https://github.com/MichMich/MagicMirror). It can display your Wunderlist todos. You can add multiple instances from different accounts with different lists.

![MMM-Wunderlist Screenshot](screenshots/screen_cap1.png?raw=true "Title")


## Installation
1. Navigate into your MagicMirror's `modules` folder and execute `git clone https://github.com/paviro/MMM-Wunderlist.git`. A new folder will appear navigate into it.
2. Execute `npm install` to install the node dependencies.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'MMM-Wunderlist',
		position: 'top_right',	// This can be any of the regions. Best results in left or right regions.
		header: 'Wunderlist', // This is optional
		config: {
			// See 'Configuration options' for more information.
		}
	}
]
````

## Retrieving API Token
*FYI: There is no additional registration required, you may use your Wunderlist Creds*

Go to [Developer.Wunderlist](https://developer.wunderlist.com/apps/new). It does not really matter what you type in here, so you may go with:
```
Name: MMM-Wunderlist
APP URL: http://localhost
AUTH CALLBACK URL: http://localhost
```

Hit *save* and you'll be displayed your `clientID`. Click on *create access token*
 and you'll get the `accessToken`. 
## Configuration options

The following properties can be configured:


<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>accessToken</code></td>
			<td>Your Wunderlist access token, you can get it <a href="https://developer.wunderlist.com/apps/new">here</a>.<br>
				<br><b>Possible values:</b> <code>string</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>clientID</code></td>
			<td>Your Wunderlist client id, you can get it <a href="https://developer.wunderlist.com/apps/new">here</a>.<br>
				<br><b>Possible values:</b> <code>string</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>lists</code></td>
			<td>Array of lists you want to display. <br>
				<br><b>Possible values:</b> <code>array</code>
				<br><b>Default value:</b> <code>["inbox"]</code>
				<br><b>Example:</b> <code>["inbox", "ViRO Entertainment"]</code>
			</td>
		</tr>
		</tr>
		<tr>
			<td><code>order</code></td>
			<td>Order of tasks on the list. <br>
				<br><b>Possible values:</b> <code>"normal"</code>, <code>"reversed"</code>
				<br><b>Default value:</b> <code>"normal"</code>
			</td>
		</tr>
		<tr>
			<td><code>maximumEntries</code></td>
			<td>Maximum number of todos to be shown.<br>
				<br><b>Possible values:</b> <code>time</code> in <code>min</code>
				<br><b>Default value:</b> <code>60</code>
			</td>
		</tr>
		<tr>
			<td><code>interval</code></td>
			<td>How often the module should load new todos.<br>
				<br><b>Possible values:</b> <code>int</code> in <code>seconds</code>
				<br><b>Default value:</b> <code>60</code>
			</td>
		</tr>
		<tr>
			<td><code>fade</code></td>
			<td>Fade todos to black. (Gradient)<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>fadePoint</code></td>
			<td>Where to start fade?<br>
				<br><b>Possible values:</b> <code>0</code> (top of the list) - <code>1</code> (bottom of list)
				<br><b>Default value:</b> <code>0.25</code>
			</td>
		</tr>
		<tr>
			<td><code>language</code></td>
			<td>Localisation for this plugin<br>
				<br><b>Possible values:</b> Moment.js Languages (See <code>node_modules/moment/languages</code> )</code> 
				<br><b>Default value:</b> Global Language (As in config.js)
			</td>
		</tr>
		<tr>
			<td><code>showDeadline</code></td>
			<td>Show deadline of a task<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>deadlineFormat</code></td>
			<td>Format for deadlines<br>
				<br><b>Possible values:</b> formats from <a href="http://momentjs.com/docs/#/displaying/format/">Moment.js</a>
				<br><b>Default value:</b> <code>L</code>
			</td>
		</tr>
		<tr>
			<td><code>showAssignee</code></td>
			<td>Show assigned user of a task<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
	</tbody>
</table>

## Dependencies
- [Wunderlist](https://www.npmjs.com/package/wunderlist) (installed via `npm install`)
- [Moment](https://www.npmjs.com/package/moment) (installed via `npm install`)

## Known issues
- After changing your password you'll have to generate a new API-Token 
- When you grant access to a new user and set `showAssignee: true` , you might have to restart MM to correctly display the assignees
- Some of requests for users list returns 404 error

The MIT License (MIT)
=====================

Copyright © 2016 Paul-Vincent Roll

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.**
