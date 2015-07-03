#############################################################################
############################ VOICE-CONTROL-SETUP ############################
#############################################################################

# 1) GET A LIST WITH ALL RELATIONSHIP-IDS WITH THE FOLLOWING NEO4J-COMMAND
# MATCH n-[r:relatedTo]->m RETURN n,ID(r),r,m
# 2) CHANGE RELATIONSHIP-IDS
# 3) RUN NEO4J-COMMANDS ONE BY ONE

# Außen-Parkplatz -> Außen-Haupteingang
MATCH n-[r:relatedTo]->m WHERE ID(r)=155 SET r.intents=["b_go_ahead"]

# Außen-Haupteingang -> E-Eingangshalle
MATCH n-[r:relatedTo]->m WHERE ID(r)=137 SET r.intents=['b_go_left',
'ind_use_door_left',
'ind_use_entranceDoor',
'outd_enter_building',
'outdName_enter_building_geo1',
'ind_enter_room_entranceHall']

# E-Eingangshalle -> E-Hörsaal
MATCH n-[r:relatedTo]->m WHERE ID(r)=146 SET r.intents=['b_go_left',
'ind_enter_room_left',
'ind_enter_1st_room_left',
'ind_use_door_left',
'ind_use_1st_door_left',
'ind_enter_room_lectureHall',
'indName_enter_room_geoLectureHall',
'ind_enter_room_lectureHall_left',
'indName_enter_room_geoLectureHall_left']

# E-Hörsaal -> E-Eingangshalle
MATCH n-[r:relatedTo]->m WHERE ID(r)=141 SET r.intents=['b_go_behind',
'ind_enter_room_entranceHall',
'ind_leave_room',
'ind_use_door_behind',
'ind_leave_room_lectureHall',
'indName_leave_room_geoLectureHall']

# E-Eingangshalle -> E-Hinteres Atrium
MATCH n-[r:relatedTo]->m WHERE ID(r)=145 SET r.intents=['b_go_diagonallyLeft',
'b_go_diagonallyLeft_then_go_left',
'b_go_ahead_then_go_left',
'b_go_until_rubbishBins_then_go_left',
'b_go_until_stairs_then_go_left',
'b_go_until_elevator_then_go_left',
'b_go_ahead_until_rubbishBins_then_go_left',
'b_go_ahead_until_stairs_then_go_left',
'b_go_ahead_until_elevator_then_go_left',
'b_go_left_pass_toilets',
'ind_use_corridor',
'ind_use_corridor_left',
'ind_use_1st_corridor_left',
'ind_follow_corridor_left']

# E-Hinteres Atrium -> E-Hinteres Atrium 2
MATCH n-[r:relatedTo]->m WHERE ID(r)=105 SET r.intents=['b_go_ahead',
'b_go_until_wall',
'b_go_ahead_until_wall',
'b_go_until_door',
'b_go_ahead_until_door',
'b_go_until_heater',
'b_go_ahead_until_heater',
'b_go_ahead_pass_chairs',
'b_go_until_opposite_door',
'b_go_until_opposite_heater',
'b_go_until_opposite_wall',
'ind_cross_room',
'ind_cross_room_atrium']

# E-Hinteres Atrium 2 -> E-Hintere Treppe/Flur
MATCH n-[r:relatedTo]->m WHERE ID(r)=111 SET r.intents=['b_go_left',
'b_go_left_until_stairs',
'b_go_until_stairs',
'ind_follow_corridor',
'ind_follow_corridor_left',
'ind_follow_corridor_until_stairs',
'ind_follow_corridor_left_until_stairs',
'ind_use_corridor',
'ind_use_corridor_until_stairs',
'ind_use_corridor_left',
'ind_use_corridor_left_until_stairs',
'ind_use_1st_corridor_left']

# E-Hintere Treppe/Flur -> 1.-Stock Atrium
MATCH n-[r:relatedTo]->m WHERE ID(r)=114 SET r.intents=['b_go_ahead',
'b_go_up',
'ind_use_stairs_up',
'ind_use_stairs_1_level_up',
'ind_use_stairs_to_1st_level']

# 1.-Stock Atrium -> 1.-Stock Treppenhaus/Aufzüge
MATCH n-[r:relatedTo]->m WHERE ID(r)=152 SET r.intents=['b_rotate_180_degrees',
'b_rotate_to_stairs',
'b_rotate_to_elevator',
'b_go_until_stairs',
'b_go_until_elevator',
'b_go_left']

# 1.-Stock Treppenhaus/Aufzüge -> 4.-Stock Treppenhaus/Aufzüge
MATCH n-[r:relatedTo]->m WHERE ID(r)=117 SET r.intents=['ind_use_elevator_to_4th_level',
'ind_use_elevator_3_levels_up']

# 4.-Stock Treppenhaus/Aufzüge -> 2.-Stock Treppenhaus/Aufzüge
MATCH n-[r:relatedTo]->m WHERE ID(r)=123 SET r.intents=['ind_use_stairs_to_2nd_level',
'ind_use_stairs_2_levels_down']

# 2.-Stock Treppenhaus/Aufzüge -> E-Aufzüge
MATCH n-[r:relatedTo]->m WHERE ID(r)=126 SET r.intents=['ind_use_elevator_down',
'ind_use_elevator_2_levels_down',
'ind_use_elevator_to_0th_level',
'ind_use_elevator_to_groundFloor',
'ind_use_elevator_to_atrium']

# E-Aufzüge -> E-Eingangshalle
MATCH n-[r:relatedTo]->m WHERE ID(r)=120 SET r.intents=['b_go_left',
'ind_cross_room',
'ind_cross_room_atrium',
'b_go_until_exit']

# E-Eingangshalle -> Außen-Haupteingang
MATCH n-[r:relatedTo]->m WHERE ID(r)=147 SET r.intents=['b_go_behind',
'ind_use_exitDoor',
'ind_use_exit',
'ind_use_entranceDoor',
'ind_use_door_behind',
'ind_leave_building',
'indName_leave_building_geo1']

# Außen-Haupteingang -> Außen-Parkplatz
MATCH n-[r:relatedTo]->m WHERE ID(r)=136 SET r.intents=['b_go_right']

#############################################################################
################################## EXAMPLE ##################################
#############################################################################
# MATCH n-[r:relatedTo]->m WHERE ID(r)= SET r.intents=[]
