/*
author: Paul Bodenbenner <paul.bodenbenner@gmail.com>
*/


const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Parser = Me.imports.parser;
const Common = Me.imports.common;

const Gettext = imports.gettext.domain('display-profile-manager');
const _ = Gettext.gettext;


const ProfilesSettingsWidget = new GObject.Class({
    Name: 'DisplayProfileManager.ProfilesSettingsWidget',
    GTypeName: 'ProfilesSettingsWidget',
    Extends: Gtk.Box,
    
    _init: function() {
        this.parent({orientation: Gtk.Orientation.VERTICAL, border_width: 10});
        
        this._settings = Convenience.getSettings();
        
        let text;
        let profileStringCurrent = this._settings.get_string(Common.SETTINGS_KEY_CURRENT_PROFILE);
        if (!profileStringCurrent) {
            text = _("Error: Could not detect current screen configuration. Extension seems not to be running.");
            let label = new Gtk.Label({label: text, xalign: 0, margin_bottom: 10});
            this.add(label);
            }
        else {
            let label1a = new Gtk.Label({label: '<b>'+_("General Settings")+'</b>', use_markup: true, xalign: 0, margin_bottom: 10});
            
            let isActive1 = this._settings.get_boolean(Common.SETTINGS_KEY_SHOW_PROFILE_DESCRIPTION);
            let checkButton1 = new Gtk.CheckButton({label:_("Show Profile Description"), active: isActive1, margin_left:20, margin_bottom: 0});
            checkButton1.connect('toggled', Lang.bind(this, this._changeCheckButton, Common.SETTINGS_KEY_SHOW_PROFILE_DESCRIPTION));
            
            let isActive2 = this._settings.get_boolean(Common.SETTINGS_KEY_SHOW_DISPLAYS_SETTINGS);
            let checkButton2 = new Gtk.CheckButton({label:_("Show \"Displays Settings\""), active: isActive2, margin_left:20, margin_bottom: 0});
            checkButton2.connect('toggled', Lang.bind(this, this._changeCheckButton, Common.SETTINGS_KEY_SHOW_DISPLAYS_SETTINGS));
            
            let isActive3 = this._settings.get_boolean(Common.SETTINGS_KEY_SHOW_DISPLAY_PROFILE_MANAGER_SETTINGS);
            let checkButton3 = new Gtk.CheckButton({label:_("Show \"Display Profile Manager Settings\""), active: isActive3, margin_left:20, margin_bottom: 10});
            checkButton3.connect('toggled', Lang.bind(this, this._changeCheckButton, Common.SETTINGS_KEY_SHOW_DISPLAY_PROFILE_MANAGER_SETTINGS));
            
            let label1 = new Gtk.Label({label: '<b>'+_("Create Profile")+'</b>', use_markup: true, xalign: 0, margin_bottom: 10});
            
            text = _("Set up your screen configuration in the \"Displays Settings\" dialog. By pressing the button below your configuration will be saved as a profile. In the \"Manage Profiles\" section you can modify your stored profiles.");
            let label2 = new Gtk.Label({label: text, use_markup: true, xalign: 0, margin_left:20, margin_bottom: 10});
            label2.set_line_wrap(true);
            
            let button = new Gtk.Button({label: _("Create a profile with current screen configuration"), margin_left:20, margin_bottom: 10});
            button.connect('clicked', Lang.bind(this, this._addProfile));
            
            let label3 = new Gtk.Label({label: '<b>'+_("Manage Profiles")+'</b>', use_markup: true, xalign: 0, margin_bottom: 10});
            
            text = _("The character \"|\" must not be used in the entry fields, except in the \"Outputs\" entries where it seperates the properties.\nThe first nine profiles can be activated using a \"Keybinding\".\nPlease use the \"Expert Mode\" only if you know what you are doing.");
            let label4 = new Gtk.Label({label: text, use_markup: true, xalign: 0, margin_left:20, margin_bottom: 10});
            label4.set_line_wrap(true);
            
            let isExpert = this._settings.get_boolean(Common.SETTINGS_KEY_EXPERT_MODE);
            let checkButton = new Gtk.CheckButton({label:_("Expert Mode"), active: isExpert, margin_left:20, margin_bottom: 10});
            checkButton.connect('toggled', Lang.bind(this, this._changeCheckButton, Common.SETTINGS_KEY_EXPERT_MODE));
            
            this.add(label1a);
            this.add(checkButton1);
            this.add(checkButton2);
            this.add(checkButton3);
            this.add(label1);
            this.add(label2);
            this.add(button);
            this.add(label3);
            this.add(label4);
            this.add(checkButton);
            
            let profilesString = this._settings.get_string(Common.SETTINGS_KEY_PROFILES);
            this._profiles = Parser.getProfilesFromString(profilesString);
            
            this._refreshGui(false);
            }
        },
        
    _addProfile: function(obj) {
        let profileStringCurrent = this._settings.get_string(Common.SETTINGS_KEY_CURRENT_PROFILE);
        let profileCurrent = Parser.getProfileFromString(profileStringCurrent);
        this._profiles.push(profileCurrent);
        
        this._saveProfile();
        this._refreshGui(true);
        },
        
    _buttonCmd: function(obj, i, j) {
        if (j == 0) {
            let keybindingTemp = this._settings.get_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString());
            this._settings.set_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString(), this._settings.get_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+2).toString()));
            this._settings.set_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+2).toString(), keybindingTemp);
            
            let profileTemp = this._profiles[i];
            this._profiles[i] = this._profiles[i+1];
            this._profiles[i+1] = profileTemp;
            }
        else if (j == 1) {
            let keybindingTemp = this._settings.get_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString());
            this._settings.set_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString(), this._settings.get_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i).toString()));
            this._settings.set_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i).toString(), keybindingTemp);
            
            let profileTemp = this._profiles[i];
            this._profiles[i] = this._profiles[i-1];
            this._profiles[i-1] = profileTemp;
            }
        else if (j == 2) {
            if (i < 9) {
                this._settings.set_strv(Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString(), []);
                }
            this._profiles.splice(i, 1);
            }
            
        this._saveProfile();
        this._refreshGui(true);
        },
        
    _changeCheckButton: function(obj, settingsKey) {
        let isActive = obj.get_active();
        this._settings.set_boolean(settingsKey, isActive);
        
        this._refreshGui(true);
        },
        
    _changeProfile: function(obj, i, j) {
        let item = obj.get_text();
        
        this._profiles[i][j] = Parser.getProfileItemFromString(item, j);
        this._saveProfile();
        },
        
    _saveProfile: function() {
        let profilesString = Parser.getProfilesAsString(this._profiles);
       	this._settings.set_string(Common.SETTINGS_KEY_PROFILES, profilesString);
        },
        
    _refreshGui: function(withReset) {
        if (withReset == true)
            this.remove(this._gridProfiles);
        this._gridProfiles = this._createGridProfiles();
        this.add(this._gridProfiles);
        },
        
    _clearTreeViewSelection: function(treeView, event) {
        let listPaths;
        let listStores;
        let selection = treeView.get_selection();
        [listPaths, listStores] = selection.get_selected_rows();
        for (let i = 0; i < listPaths.length; i++) {
            selection.unselect_path(listPaths[i]);
            }
        },
        
    _keyBindingEdited: function(cellrendereraccel, pathString, accelKey, accelMods, hardwareKeyCode, listStore, iter, keyBindingProfileString) {
        let acceleratorString = Gtk.accelerator_name(accelKey, accelMods);
        this._updateKeyBinding(acceleratorString, listStore, iter);
        this._settings.set_strv(keyBindingProfileString, [acceleratorString]);
        },
        
    _keyBindingCleared: function(cellrendereraccel, pathString, listStore, iter, keyBindingProfileString) {
        this._updateKeyBinding('', listStore, iter);
        this._settings.set_strv(keyBindingProfileString, []);
        },
        
    _updateKeyBinding: function(acceleratorString, listStore, iter) {
        let accelKey = 0;
        let accelMods = 0;
        if (acceleratorString != '')
            [accelKey, accelMods] = Gtk.accelerator_parse(acceleratorString);
        listStore.set(iter, [0, 1], [accelKey, accelMods]);
        },
        
    _createTreeViewKeyBinding: function(keyBindingProfileString) {
        let treeView = new Gtk.TreeView({headers_visible: false, margin_right: 5});
        treeView.connect('focus-out-event', this._clearTreeViewSelection);
        let listStore = new Gtk.ListStore();
        listStore.set_column_types([GObject.TYPE_INT, GObject.TYPE_INT]);
        let iter = listStore.append([0, 0]);
        treeView.set_model(listStore);
        let cellrendereraccel = new Gtk.CellRendererAccel({editable: true});
        cellrendereraccel.connect('accel_edited', Lang.bind(this, this._keyBindingEdited, listStore, iter, keyBindingProfileString));
        cellrendereraccel.connect('accel_cleared', Lang.bind(this, this._keyBindingCleared, listStore, iter, keyBindingProfileString));
        let column = new Gtk.TreeViewColumn();
        column.pack_start(cellrendereraccel, true);
        column.add_attribute(cellrendereraccel, 'accel-key', 0);
        column.add_attribute(cellrendereraccel, 'accel-mods', 1);
        treeView.append_column(column);
        let acceleratorString = this._settings.get_strv(keyBindingProfileString).toString();
        this._updateKeyBinding(acceleratorString, listStore, iter);
        return treeView;
        },
        
    _createGridProfiles: function() {
        let grid = new Gtk.Grid({margin_left: 20});
        
        if (this._profiles.length > 0) {
            let isExpert = this._settings.get_boolean(Common.SETTINGS_KEY_EXPERT_MODE, isExpert);
            
           	let iEntry;
           	let iGrid;
           	let iLabel;
           	let iButton;
           	let iItem;
           	let buttonsText = new Array(_("Down"), _("Up"), _("Del"));
           	let buttonsMargin = new Array(5, 0, 5);
           	let labelsText = new Array('#', _("Keybinding"), _("Profile Name"), _("Clone"), _("Outputs")+' ('+_("Name")+' | '+_("Display Name")+' | '+_("X")+' | '+_("Y")+' | '+_("Width")+' | '+_("Height")+' | '+_("Refresh Rate")+' | '+_("Rotation")+' | '+_("Primary")+')');
           	let itemString;
           	
            for (let i = 0; i < labelsText.length; i++) {
                iLabel = new Gtk.Label({label: labelsText[i], margin_bottom: 5});
                grid.attach(iLabel, i, 0, 1, 1);
                }
                
            for (let i = 0; i < this._profiles.length; i++) {
                iLabel = new Gtk.Label({label: (i+1).toString() + '.', xalign: 1, margin_right: 5});
                grid.attach(iLabel, 0, i+1, 1, 1);
                
                if (i < 9) {
                    itemString = Common.SETTINGS_KEY_KEYBINDING_PROFILE + (i+1).toString();
                    iItem = this._createTreeViewKeyBinding(itemString);
                    }
                else {
                    itemString = '';
                    iItem = new Gtk.Label({label: itemString, xalign: 0, margin_right: 5});
                    }
                grid.attach(iItem, 1, i+1, 1, 1);
                
                itemString = Parser.getProfileItemAsString(this._profiles[i][0], 0);
                iEntry = new Gtk.Entry({margin_right: 5});
                iEntry.set_text(itemString);
                iEntry.connect('changed', Lang.bind(this, this._changeProfile, i, 0));
                iEntry.set_width_chars(15);
                grid.attach(iEntry, 2, i+1, 1, 1);
                
                itemString = Parser.getProfileItemAsString(this._profiles[i][1], 1);
                iEntry = new Gtk.Entry({sensitive: isExpert});
                iEntry.set_text(itemString);
                iEntry.connect('changed', Lang.bind(this, this._changeProfile, i, 1));
                iEntry.set_width_chars(5);
                grid.attach(iEntry, 3, i+1, 1, 1);
                
                iGrid = new Gtk.Grid();
                for (let j = 2; j < this._profiles[i].length; j++) {
                    itemString = Parser.getProfileItemAsString(this._profiles[i][j], j);
                    iEntry = new Gtk.Entry({hexpand: true, sensitive: isExpert});
                    iEntry.set_text(itemString);
            		iEntry.connect('changed', Lang.bind(this, this._changeProfile, i, j));
                    iGrid.attach(iEntry, j-2, 0, 1, 1);
                    }
                grid.attach(iGrid, 4, i+1, 1, 1);
                
                iGrid = new Gtk.Grid();
                for (let j = 0; j < buttonsText.length; j++) {
                    iButton = new Gtk.Button({label: buttonsText[j], margin_left: buttonsMargin[j]});
                    iButton.connect('clicked', Lang.bind(this, this._buttonCmd, i, j));
                    if ((j == 0 && i == this._profiles.length-1) || (j == 1 && i == 0))
                        iButton.set_sensitive(false);
                    iGrid.attach(iButton, j, 0, 1, 1);
                    }
                grid.attach(iGrid, 5, i+1, 1, 1);
                }
            }
            
        grid.show_all();
        return grid
    }
    });
    
    
function init() {
    Convenience.initTranslations("display-profile-manager");
    }
    
function buildPrefsWidget() {
    let widget = new ProfilesSettingsWidget();
    widget.show_all();
    return widget;
    }
    
