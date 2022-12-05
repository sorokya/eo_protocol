# Endless Online Protocol

This repository contains the text representation of the [Endless Online](http://endless-online.com) network and pub protocol.

Originall written by [Sausage](https://github.com/tehsausage) for the [eoref](https://github.com/eoserv/eoref) project.

# Primitives
- byte - raw byte
- char - eo packet byte
- short - eo packed two byte integer
- three - eo packed three byte integer
- int - eo packed four byte integer
- string - string ending with a break character
- raw_string - string of fixed length or read to end of the stream if no length specified
- break - 0xFF

# Documentation comments

Put between double quotes before an enum, struct, server_packet, or client_packet
```
"Confirm initialization data"
client_packet(Connection, Accept)
```

# Enums

```
enum AdminLevel : char
{
	0 Player
	1 Guide
	2 Guardian
	3 GM
	4 HGM
}
```

# Structs

```
struct ServerSettings
{
	short jail_map
	short rescue_map
	char rescue_x
	char rescue_y
	short light_guide_flood_rate
	short guardian_flood_rate
	short gm_flood_rate
	short hgm_flood_rate
}
```

# Packets

server_packet and client_packet

```
"Confirm initialization data"
client_packet(Connection, Accept)
{
	short encode_multiple
	short encode_multiple
	short player_id
}

server_packet(AdminInteract, Remove)
{
	short player_id
}
```

# Unions

A lot of packets have different data depending on a reply code. With Unions we can represent this.

```
"Requesting a file"
client_packet(Welcome, Agree)
{
	FileType file_type
	short session_id
	union (file_type)
	{
		Map: map
		{
			short character_id
		}
		Item: item
		{
			char file_id
		}
		NPC: npc
		{
			char file_id
		}
		Spell: spell
		{
			char file_id
		}
		Class: class
		{
			char file_id
		}
	}
}
```

Unions can also be nested

```
"Initialization reply"
server_packet(Init, Init)
{
	InitReply reply_code

	union(reply_code)
	{
		// ...

		Banned: banned
		{
			InitBanType ban_type

			union(ban_type)
			{
				Temp: ban_temp
				{
					byte mins_remaining
				}
			}
		}

        // ...
    }
}
```
