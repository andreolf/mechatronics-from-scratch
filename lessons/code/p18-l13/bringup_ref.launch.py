# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
# bringup.launch.py: the same description as the model above.
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, GroupAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, PushRosNamespace
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    robot = LaunchConfiguration('robot')
    params = PathJoinSubstitution([FindPackageShare('my_robot'), 'config', 'params.yaml'])
    return LaunchDescription([
        DeclareLaunchArgument('robot', default_value='robot1'),
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        DeclareLaunchArgument('with_logger', default_value='true'),
        GroupAction([
            PushRosNamespace(robot),
            Node(package='my_robot', executable='driver', name='driver', parameters=[params]),
            Node(package='my_robot', executable='controller', name='controller',
                 parameters=[params, {'use_sim_time': LaunchConfiguration('use_sim_time')}],
                 remappings=[('cmd_vel', 'base/cmd_vel')]),
        ]),
        GroupAction([
            PushRosNamespace('tools'),
            Node(package='my_robot', executable='logger', name='logger', parameters=[params, {'rate': 10.0}]),
        ], condition=IfCondition(LaunchConfiguration('with_logger'))),
    ])
